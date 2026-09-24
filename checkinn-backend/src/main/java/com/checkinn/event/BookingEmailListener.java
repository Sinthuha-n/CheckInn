
package com.checkinn.event;

import com.checkinn.entity.Booking;
import com.checkinn.repository.BookingRepository;
import com.checkinn.service.EmailService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class BookingEmailListener {

    private static final Logger log =
            LoggerFactory.getLogger(BookingEmailListener.class);

    private final BookingRepository bookingRepository;
    private final EmailService emailService;

    public BookingEmailListener(
            BookingRepository bookingRepository,
            EmailService emailService
    ) {
        this.bookingRepository = bookingRepository;
        this.emailService = emailService;
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
                                    "Booking not found"
                            )
                    );

            emailService.sendBookingConfirmation(
                    booking.getUser().getEmail(),
                    booking
            );

            log.info(
                    "Booking confirmation email sent for booking {}",
                    booking.getId()
            );

        } catch (Exception e) {
            log.error(
                    "Failed to send confirmation for booking {}",
                    event.bookingId(),
                    e
            );
        }
    }
}