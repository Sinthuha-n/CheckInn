
package com.checkinn.event;

import com.checkinn.entity.Booking;
import com.checkinn.entity.EmailNotification;
import com.checkinn.enums.EmailStatus;
import com.checkinn.repository.BookingRepository;
import com.checkinn.repository.EmailNotificationRepository;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDateTime;

@Component
public class BookingEmailQueueListener {

    private final BookingRepository bookingRepository;
    private final EmailNotificationRepository notificationRepository;

    public BookingEmailQueueListener(
            BookingRepository bookingRepository,
            EmailNotificationRepository notificationRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.notificationRepository = notificationRepository;
    }

    @TransactionalEventListener(
            phase = TransactionPhase.BEFORE_COMMIT
    )
    public void queueConfirmationEmail(
            BookingConfirmedEvent event
    ) {

        // Prevent duplicate notification records
        if (notificationRepository
                .findByBookingId(event.bookingId())
                .isPresent()) {
            return;
        }

        Booking booking = bookingRepository
                .findById(event.bookingId())
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Booking not found: "
                                        + event.bookingId()
                        )
                );

        EmailNotification notification =
                new EmailNotification();

        notification.setBookingId(booking.getId());

        notification.setRecipientEmail(
                booking.getUser().getEmail()
        );

        notification.setStatus(EmailStatus.PENDING);

        notification.setRetryCount(0);

        notification.setNextRetryAt(
                LocalDateTime.now()
        );

        notificationRepository.save(notification);
    }
}