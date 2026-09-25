
package com.checkinn.service;

import com.checkinn.entity.Booking;
import com.checkinn.entity.EmailNotification;
import com.checkinn.enums.EmailStatus;
import com.checkinn.repository.BookingRepository;
import com.checkinn.repository.EmailNotificationRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Service
public class EmailDeliveryService {

    private static final Logger log =
            LoggerFactory.getLogger(EmailDeliveryService.class);

    private static final int MAX_ATTEMPTS = 3;

    private final BookingRepository bookingRepository;
    private final EmailNotificationRepository notificationRepository;
    private final EmailNotificationClaimService claimService;
    private final EmailService emailService;

    public EmailDeliveryService(
            BookingRepository bookingRepository,
            EmailNotificationRepository notificationRepository,
            EmailNotificationClaimService claimService,
            EmailService emailService
    ) {
        this.bookingRepository = bookingRepository;
        this.notificationRepository = notificationRepository;
        this.claimService = claimService;
        this.emailService = emailService;
    }

    public void deliver(Long bookingId) {

        // Only the worker that obtains the claim may send.
        if (!claimService.claim(bookingId)) {
            log.debug(
                    "Email notification is not ready or already claimed: {}",
                    bookingId
            );
            return;
        }

        EmailNotification notification =
                notificationRepository.findByBookingId(bookingId)
                        .orElseThrow(() ->
                                new IllegalStateException(
                                        "Notification not found: " + bookingId
                                )
                        );

        Booking booking;

        try {
            booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() ->
                            new IllegalStateException(
                                    "Booking not found: " + bookingId
                            )
                    );
        } catch (Exception error) {
            markFailed(notification, 0, error);
            return;
        }

        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {

            try {
                emailService.sendBookingConfirmation(
                        notification.getRecipientEmail(),
                        booking
                );

            } catch (Exception emailError) {

                log.warn(
                        "Email attempt {}/{} failed for booking {}",
                        attempt,
                        MAX_ATTEMPTS,
                        bookingId,
                        emailError
                );

                if (attempt == MAX_ATTEMPTS) {
                    markFailed(notification, attempt, emailError);
                    return;
                }

                try {
                    TimeUnit.SECONDS.sleep(2);
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    markFailed(notification, attempt, interrupted);
                    return;
                }

                continue;
            }

            // Keep status persistence separate from SMTP retries.
            // If the email was sent, do not resend merely because
            // the database update encounters an error.
            markSent(notification, attempt);

            log.info(
                    "Confirmation email sent for booking {}",
                    bookingId
            );

            return;
        }
    }

    private void markSent(
            EmailNotification notification,
            int attempts
    ) {
        notification.setStatus(EmailStatus.SENT);
        notification.setRetryCount(
                notification.getRetryCount() + attempts
        );
        notification.setSentAt(LocalDateTime.now());
        notification.setNextRetryAt(null);
        notification.setLastError(null);

        notificationRepository.save(notification);
    }

    private void markFailed(
            EmailNotification notification,
            int attempts,
            Exception error
    ) {
        notification.setStatus(EmailStatus.FAILED);
        notification.setRetryCount(
                notification.getRetryCount() + attempts
        );
        notification.setNextRetryAt(
                LocalDateTime.now().plusMinutes(5)
        );

        String message = error.getMessage();

        if (message != null && message.length() > 1000) {
            message = message.substring(0, 1000);
        }

        notification.setLastError(message);

        notificationRepository.save(notification);
    }
}