
package com.checkinn;

import com.checkinn.entity.EmailNotification;
import com.checkinn.enums.EmailStatus;
import com.checkinn.repository.EmailNotificationRepository;
import com.checkinn.scheduler.EmailRetryScheduler;
import com.checkinn.service.EmailDeliveryService;
import com.checkinn.service.EmailNotificationClaimService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class EmailRetrySchedulerTest {

    private EmailNotificationRepository notificationRepository;
    private EmailNotificationClaimService claimService;
    private EmailDeliveryService deliveryService;

    private EmailRetryScheduler scheduler;

    @BeforeEach
    void setUp() {

        notificationRepository =
                mock(EmailNotificationRepository.class);

        claimService =
                mock(EmailNotificationClaimService.class);

        deliveryService =
                mock(EmailDeliveryService.class);

        scheduler = new EmailRetryScheduler(
                notificationRepository,
                claimService,
                deliveryService
        );

        // Scheduler adds failed notifications
        // to the pending list, so it must be mutable.
        when(notificationRepository
                .findByStatusAndNextRetryAtLessThanEqual(
                        eq(EmailStatus.PENDING),
                        any(LocalDateTime.class)
                ))
                .thenReturn(new ArrayList<>());

        when(notificationRepository
                .findByStatusAndNextRetryAtLessThanEqual(
                        eq(EmailStatus.FAILED),
                        any(LocalDateTime.class)
                ))
                .thenReturn(new ArrayList<>());
    }

    @Test
    void shouldDeliverPendingAndFailedEmails() {

        EmailNotification pending =
                createNotification(101L, EmailStatus.PENDING);

        EmailNotification failed =
                createNotification(102L, EmailStatus.FAILED);

        when(notificationRepository
                .findByStatusAndNextRetryAtLessThanEqual(
                        eq(EmailStatus.PENDING),
                        any(LocalDateTime.class)
                ))
                .thenReturn(new ArrayList<>(List.of(pending)));

        when(notificationRepository
                .findByStatusAndNextRetryAtLessThanEqual(
                        eq(EmailStatus.FAILED),
                        any(LocalDateTime.class)
                ))
                .thenReturn(new ArrayList<>(List.of(failed)));

        scheduler.retryFailedEmails();

        verify(deliveryService).deliver(101L);
        verify(deliveryService).deliver(102L);

        verify(deliveryService, times(2))
                .deliver(anyLong());
    }

    @Test
    void shouldRecoverExpiredClaimsBeforeDelivery() {

        when(claimService.releaseExpiredClaims())
                .thenReturn(2);

        scheduler.retryFailedEmails();

        verify(claimService, times(1))
                .releaseExpiredClaims();

        verify(notificationRepository)
                .findByStatusAndNextRetryAtLessThanEqual(
                        eq(EmailStatus.PENDING),
                        any(LocalDateTime.class)
                );

        verify(notificationRepository)
                .findByStatusAndNextRetryAtLessThanEqual(
                        eq(EmailStatus.FAILED),
                        any(LocalDateTime.class)
                );
    }

    @Test
    void shouldNotDeliverWhenNoEmailsAreReady() {

        scheduler.retryFailedEmails();

        verifyNoInteractions(deliveryService);
    }

    @Test
    void shouldContinueAfterOneDeliveryFails() {

        EmailNotification first =
                createNotification(201L, EmailStatus.FAILED);

        EmailNotification second =
                createNotification(202L, EmailStatus.FAILED);

        when(notificationRepository
                .findByStatusAndNextRetryAtLessThanEqual(
                        eq(EmailStatus.FAILED),
                        any(LocalDateTime.class)
                ))
                .thenReturn(
                        new ArrayList<>(
                                List.of(first, second)
                        )
                );

        doThrow(new RuntimeException("Delivery error"))
                .when(deliveryService)
                .deliver(201L);

        scheduler.retryFailedEmails();

        verify(deliveryService).deliver(201L);
        verify(deliveryService).deliver(202L);
    }

    private EmailNotification createNotification(
            Long bookingId,
            EmailStatus status
    ) {

        EmailNotification notification =
                new EmailNotification();

        notification.setBookingId(bookingId);
        notification.setRecipientEmail(
                "test@example.com"
        );
        notification.setStatus(status);
        notification.setNextRetryAt(
                LocalDateTime.now().minusMinutes(1)
        );

        return notification;
    }
}
