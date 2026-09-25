
package com.checkinn.integration;

import com.checkinn.entity.EmailNotification;
import com.checkinn.enums.EmailStatus;
import com.checkinn.repository.EmailNotificationRepository;
import com.checkinn.service.EmailNotificationClaimService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
        "jwt.secret=integration-test-secret-key-1234567890",
        "spring.mail.host=localhost",
        "spring.mail.port=2525",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@Testcontainers
class EmailClaimIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:17-alpine");

    @DynamicPropertySource
    static void databaseProperties(
            DynamicPropertyRegistry registry
    ) {
        registry.add(
                "spring.datasource.url",
                postgres::getJdbcUrl
        );

        registry.add(
                "spring.datasource.username",
                postgres::getUsername
        );

        registry.add(
                "spring.datasource.password",
                postgres::getPassword
        );
    }

    @Autowired
    private EmailNotificationRepository notificationRepository;

    @Autowired
    private EmailNotificationClaimService claimService;

    private EmailNotification createNotification(
            Long bookingId
    ) {
        EmailNotification notification =
                new EmailNotification();

        notification.setBookingId(bookingId);
        notification.setRecipientEmail(
                "test@example.com"
        );
        notification.setStatus(EmailStatus.PENDING);
        notification.setRetryCount(0);
        notification.setNextRetryAt(
                LocalDateTime.now().minusMinutes(1)
        );

        return notificationRepository.saveAndFlush(
                notification
        );
    }

    @Test
    void onlyOneWorkerCanClaimNotification()
            throws Exception {

        EmailNotification notification =
                createNotification(1001L);

        Long bookingId = notification.getBookingId();

        ExecutorService executor =
                Executors.newFixedThreadPool(2);

        CountDownLatch start = new CountDownLatch(1);

        try {
            Future<Boolean> workerA = executor.submit(
                    () -> {
                        start.await();
                        return claimService.claim(bookingId);
                    }
            );

            Future<Boolean> workerB = executor.submit(
                    () -> {
                        start.await();
                        return claimService.claim(bookingId);
                    }
            );

            // Release both workers at approximately
            // the same time.
            start.countDown();

            boolean resultA =
                    workerA.get(30, TimeUnit.SECONDS);

            boolean resultB =
                    workerB.get(30, TimeUnit.SECONDS);

            // Exactly one worker must obtain the claim.
            assertNotEquals(resultA, resultB);

            EmailNotification updated =
                    notificationRepository
                            .findByBookingId(bookingId)
                            .orElseThrow();

            assertEquals(
                    EmailStatus.PROCESSING,
                    updated.getStatus()
            );

            assertTrue(
                    updated.getNextRetryAt()
                            .isAfter(LocalDateTime.now())
            );

        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void expiredClaimShouldBeRecovered() {

        EmailNotification notification =
                createNotification(1002L);

        notification.setStatus(
                EmailStatus.PROCESSING
        );

        // Simulate a worker that crashed
        // after its claim expired.
        notification.setNextRetryAt(
                LocalDateTime.now().minusMinutes(15)
        );

        notificationRepository.saveAndFlush(
                notification
        );

        int recovered =
                claimService.releaseExpiredClaims();

        assertEquals(1, recovered);

        EmailNotification updated =
                notificationRepository
                        .findByBookingId(1002L)
                        .orElseThrow();

        assertEquals(
                EmailStatus.FAILED,
                updated.getStatus()
        );

        assertNotNull(updated.getNextRetryAt());

        assertTrue(
                !updated.getNextRetryAt()
                        .isAfter(LocalDateTime.now())
        );

        // The recovered notification can be claimed again.
        assertTrue(
                claimService.claim(1002L)
        );
    }
}
