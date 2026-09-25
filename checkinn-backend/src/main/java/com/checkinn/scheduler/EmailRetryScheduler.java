
package com.checkinn.scheduler;

import com.checkinn.entity.EmailNotification;
import com.checkinn.enums.EmailStatus;
import com.checkinn.event.BookingConfirmedEvent;
import com.checkinn.event.BookingEmailListener;
import com.checkinn.repository.EmailNotificationRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class EmailRetryScheduler {

    private static final Logger log =
            LoggerFactory.getLogger(EmailRetryScheduler.class);

    private final EmailNotificationRepository notificationRepository;
    private final BookingEmailListener bookingEmailListener;

    public EmailRetryScheduler(
            EmailNotificationRepository notificationRepository,
            BookingEmailListener bookingEmailListener
    ) {
        this.notificationRepository = notificationRepository;
        this.bookingEmailListener = bookingEmailListener;
    }

    // Check for failed emails every 60 seconds
    @Scheduled(fixedDelay = 60000)
    public void retryFailedEmails() {

        List<EmailNotification> failedEmails =
                notificationRepository
                        .findByStatusAndNextRetryAtLessThanEqual(
                                EmailStatus.FAILED,
                                LocalDateTime.now()
                        );

        log.info(
                "Found {} email notifications ready for retry",
                failedEmails.size()
        );

        for (EmailNotification notification : failedEmails) {

            log.info(
                    "Retrying confirmation email for booking {}",
                    notification.getBookingId()
            );

            try {
                bookingEmailListener.sendConfirmation(
                        new BookingConfirmedEvent(
                                notification.getBookingId()
                        )
                );

            } catch (Exception error) {
                log.error(
                        "Could not dispatch email retry for booking {}",
                        notification.getBookingId(),
                        error
                );
            }
        }
    }
}