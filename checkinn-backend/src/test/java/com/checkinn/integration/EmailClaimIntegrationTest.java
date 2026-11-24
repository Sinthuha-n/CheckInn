
package com.checkinn.integration;

import com.checkinn.entity.EmailNotification;
import com.checkinn.enums.EmailStatus;
import com.checkinn.repository.EmailNotificationRepository;
import com.checkinn.service.EmailNotificationClaimService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;


import java.time.LocalDateTime;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:email_claim_test_db;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.flyway.enabled=true",
        "spring.flyway.baseline-on-migrate=true",
        "spring.flyway.baseline-version=0",
        "spring.jpa.hibernate.ddl-auto=validate",
        "jwt.secret=integration-test-secret-key-1234567890",
        "spring.mail.host=localhost",
        "spring.mail.port=2525",
        "checkinn.inventory.seed-enabled=false"
})
class EmailClaimIntegrationTest {

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
