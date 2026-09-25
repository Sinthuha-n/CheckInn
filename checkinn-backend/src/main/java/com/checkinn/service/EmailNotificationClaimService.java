
package com.checkinn.service;

import com.checkinn.repository.EmailNotificationRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class EmailNotificationClaimService {

    private final EmailNotificationRepository notificationRepository;

    public EmailNotificationClaimService(
            EmailNotificationRepository notificationRepository
    ) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public boolean claim(Long bookingId) {

        LocalDateTime now = LocalDateTime.now();

        int updatedRows =
                notificationRepository.claimNotification(
                        bookingId,
                        now,
                        now.plusMinutes(10)
                );

        return updatedRows == 1;
    }

    @Transactional
    public int releaseExpiredClaims() {

        return notificationRepository.releaseExpiredClaims(
                LocalDateTime.now()
        );
    }
}