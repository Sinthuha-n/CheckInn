
package com.checkinn.repository;

import com.checkinn.entity.EmailNotification;
import com.checkinn.enums.EmailStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EmailNotificationRepository
        extends JpaRepository<EmailNotification, Long> {

    // Find the notification belonging to a booking
    Optional<EmailNotification> findByBookingId(Long bookingId);

    // Find failed notifications ready for retry
    List<EmailNotification>
    findByStatusAndNextRetryAtLessThanEqual(
            EmailStatus status,
            LocalDateTime nextRetryAt
    );

    // Atomically claim a notification before sending
    @Modifying
    @Transactional
    @Query("""
        UPDATE EmailNotification e
        SET e.status = com.checkinn.enums.EmailStatus.PROCESSING,
            e.nextRetryAt = :leaseUntil
        WHERE e.bookingId = :bookingId
          AND e.status IN (
              com.checkinn.enums.EmailStatus.PENDING,
              com.checkinn.enums.EmailStatus.FAILED
          )
          AND (
              e.nextRetryAt IS NULL
              OR e.nextRetryAt <= :now
          )
    """)
    int claimNotification(
            @Param("bookingId") Long bookingId,
            @Param("now") LocalDateTime now,
            @Param("leaseUntil") LocalDateTime leaseUntil
    );

    // Release claims left behind after a worker crashes
    @Modifying
    @Transactional
    @Query("""
        UPDATE EmailNotification e
        SET e.status = com.checkinn.enums.EmailStatus.FAILED,
            e.nextRetryAt = :now
        WHERE e.status = com.checkinn.enums.EmailStatus.PROCESSING
          AND e.nextRetryAt <= :now
    """)
    int releaseExpiredClaims(
            @Param("now") LocalDateTime now
    );
}