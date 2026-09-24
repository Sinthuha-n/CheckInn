
package com.checkinn.repository;

import com.checkinn.entity.EmailNotification;
import com.checkinn.enums.EmailStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface EmailNotificationRepository
        extends JpaRepository<EmailNotification, Long> {

    List<EmailNotification>
    findByStatusAndNextRetryAtLessThanEqual(
            EmailStatus status,
            LocalDateTime nextRetryAt
    );
}
