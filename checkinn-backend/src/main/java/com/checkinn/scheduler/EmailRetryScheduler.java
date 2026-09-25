
package com.checkinn.scheduler;

import com.checkinn.entity.EmailNotification;
import com.checkinn.enums.EmailStatus;
import com.checkinn.repository.EmailNotificationRepository;
import com.checkinn.service.EmailDeliveryService;
import com.checkinn.service.EmailNotificationClaimService;

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
    private final EmailNotificationClaimService claimService;
    private final EmailDeliveryService deliveryService;

    public EmailRetryScheduler(
            EmailNotificationRepository notificationRepository,
            EmailNotificationClaimService claimService,
            EmailDeliveryService deliveryService
    ) {
        this.notificationRepository = notificationRepository;
        this.claimService = claimService;
        this.deliveryService = deliveryService;
    }

    @Scheduled(fixedDelay = 60000)
    public void retryFailedEmails() {

        // Recover claims left behind by crashed workers.
        int recovered = claimService.releaseExpiredClaims();

        if (recovered > 0) {
            log.info("Recovered {} expired email claims", recovered);
        }

        LocalDateTime now = LocalDateTime.now();

        List<EmailNotification> pending =
                notificationRepository
                        .findByStatusAndNextRetryAtLessThanEqual(
                                EmailStatus.PENDING,
                                now
                        );

        List<EmailNotification> failed =
                notificationRepository
                        .findByStatusAndNextRetryAtLessThanEqual(
                                EmailStatus.FAILED,
                                now
                        );

        pending.addAll(failed);

        for (EmailNotification notification : pending) {

            try {
                deliveryService.deliver(
                        notification.getBookingId()
                );

            } catch (Exception error) {
                log.error(
                        "Scheduled delivery failed for booking {}",
                        notification.getBookingId(),
                        error
                );
            }
        }
    }
}