
package com.checkinn.event;

import com.checkinn.service.EmailDeliveryService;

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

    private final EmailDeliveryService emailDeliveryService;

    public BookingEmailListener(
            EmailDeliveryService emailDeliveryService
    ) {
        this.emailDeliveryService = emailDeliveryService;
    }

    @Async
    @TransactionalEventListener(
            phase = TransactionPhase.AFTER_COMMIT
    )
    public void sendConfirmation(BookingConfirmedEvent event) {

        try {
            emailDeliveryService.deliver(event.bookingId());

        } catch (Exception error) {
            log.error(
                    "Email delivery processing failed for booking {}",
                    event.bookingId(),
                    error
            );
        }
    }
}