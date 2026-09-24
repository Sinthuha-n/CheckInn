package com.checkinn.event;

import com.checkinn.entity.Booking;
import com.checkinn.entity.EmailNotification;
import com.checkinn.enums.EmailStatus;
import com.checkinn.repository.BookingRepository;
import com.checkinn.repository.EmailNotificationRepository;
import com.checkinn.service.EmailService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Component
public class BookingEmailListener {

    private static final Logger log =
            LoggerFactory.getLogger(BookingEmailListener.class);

    private static final int MAX_RETRIES = 3;

    private final BookingRepository bookingRepository;
    private final EmailService emailService;
    private final EmailNotificationRepository notificationRepository;

    public BookingEmailListener(
            BookingRepository bookingRepository,
            EmailService emailService,
            EmailNotificationRepository notificationRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.emailService = emailService;
        this.notificationRepository = notificationRepository;
    }

    @Async
    @TransactionalEventListener(
            phase = TransactionPhase.AFTER_COMMIT
    )
    public void sendConfirmation(BookingConfirmedEvent event) {

        try {
            Booking booking = bookingRepository
                    .findById(event.bookingId())
                    .orElseThrow(() ->
                            new IllegalStateException(
                                    "Booking not found: "
                                            + event.bookingId()
                            )
                    );

            sendEmailWithRetry(booking);

        } catch (Exception error) {
            log.error(
                    "Failed to process confirmation for booking {}",
                    event.bookingId(),
                    error
            );
        }
    }

    private void sendEmailWithRetry(Booking booking) {

        int attempt = 0;

        while (attempt < MAX_RETRIES) {

            attempt++;

            try {
                emailService.sendBookingConfirmation(
                        booking.getUser().getEmail(),
                        booking
                );

                markAsSent(
                        booking.getId(),
                        attempt
                );

                log.info(
                        "Confirmation email sent for booking {} on attempt {}",
                        booking.getId(),
                        attempt
                );

                return;

            } catch (Exception emailError) {

                log.warn(
                        "Email attempt {}/{} failed for booking {}",
                        attempt,
                        MAX_RETRIES,
                        booking.getId(),
                        emailError
                );

                if (attempt >= MAX_RETRIES) {

                    markAsFailed(
                            booking.getId(),
                            attempt,
                            emailError
                    );

                    log.error(
                            "Email failed after {} attempts for booking {}",
                            MAX_RETRIES,
                            booking.getId()
                    );

                    return;
                }

                try {
                    TimeUnit.SECONDS.sleep(2);

                } catch (InterruptedException interruptedError) {

                    Thread.currentThread().interrupt();

                    markAsFailed(
                            booking.getId(),
                            attempt,
                            interruptedError
                    );

                    return;
                }
            }
        }
    }

    private void markAsSent(
            Long bookingId,
            int attempt
    ) {

        notificationRepository
                .findByBookingId(bookingId)
                .ifPresent(notification -> {

                    notification.setStatus(EmailStatus.SENT);
                    notification.setRetryCount(attempt);
                    notification.setSentAt(LocalDateTime.now());
                    notification.setNextRetryAt(null);
                    notification.setLastError(null);

                    notificationRepository.save(notification);
                });
    }

    private void markAsFailed(
            Long bookingId,
            int attempt,
            Exception error
    ) {

        notificationRepository
                .findByBookingId(bookingId)
                .ifPresent(notification -> {

                    notification.setStatus(EmailStatus.FAILED);
                    notification.setRetryCount(attempt);
                    notification.setLastError(error.getMessage());

                    notification.setNextRetryAt(
                            LocalDateTime.now().plusMinutes(5)
                    );

                    notificationRepository.save(notification);
                });
    }
}