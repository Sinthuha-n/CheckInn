
package com.checkinn;

import com.checkinn.entity.Booking;
import com.checkinn.entity.EmailNotification;
import com.checkinn.entity.User;
import com.checkinn.enums.EmailStatus;
import com.checkinn.repository.BookingRepository;
import com.checkinn.repository.EmailNotificationRepository;
import com.checkinn.service.EmailDeliveryService;
import com.checkinn.service.EmailNotificationClaimService;
import com.checkinn.service.EmailService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EmailDeliveryServiceTest {

    private BookingRepository bookingRepository;
    private EmailService emailService;
    private EmailNotificationRepository notificationRepository;
    private EmailNotificationClaimService claimService;

    private EmailDeliveryService deliveryService;

    private Booking booking;
    private EmailNotification notification;

    @BeforeEach
    void setUp() {

        // Mock external dependencies
        bookingRepository = mock(BookingRepository.class);
        emailService = mock(EmailService.class);

        notificationRepository =
                mock(EmailNotificationRepository.class);

        claimService =
                mock(EmailNotificationClaimService.class);

        // Create the REAL service being tested
        deliveryService = new EmailDeliveryService(
                bookingRepository,
                notificationRepository,
                claimService,
                emailService
        );

        // Prepare test user
        User user = new User();
        user.setEmail("test@example.com");

        // Prepare test booking
        booking = mock(Booking.class);

        when(booking.getId()).thenReturn(1L);
        when(booking.getUser()).thenReturn(user);

        // Prepare email notification
        notification = new EmailNotification();
        notification.setBookingId(1L);
        notification.setRecipientEmail("test@example.com");
        notification.setStatus(EmailStatus.PENDING);
        notification.setRetryCount(0);

        // Repository mock responses
        when(bookingRepository.findById(1L))
                .thenReturn(Optional.of(booking));

        when(notificationRepository.findByBookingId(1L))
                .thenReturn(Optional.of(notification));

        // Allow this service to claim the notification
        when(claimService.claim(1L)).thenReturn(true);
    }

    // Test 1: Email succeeds immediately

    @Test
    void emailShouldSendOnFirstAttempt() throws Exception {

        deliveryService.deliver(1L);

        verify(emailService, times(1))
                .sendBookingConfirmation(
                        "test@example.com",
                        booking
                );

        assertEquals(
                EmailStatus.SENT,
                notification.getStatus()
        );

        assertEquals(1, notification.getRetryCount());

        assertNotNull(notification.getSentAt());

        verify(notificationRepository, times(1))
                .save(notification);
    }

    // Test 2: First attempt fails, second succeeds

    @Test
    void emailShouldRetryAfterFirstFailure() throws Exception {

        doThrow(new RuntimeException("SMTP unavailable"))
                .doNothing()
                .when(emailService)
                .sendBookingConfirmation(
                        "test@example.com",
                        booking
                );

        deliveryService.deliver(1L);

        verify(emailService, times(2))
                .sendBookingConfirmation(
                        "test@example.com",
                        booking
                );

        assertEquals(
                EmailStatus.SENT,
                notification.getStatus()
        );

        assertEquals(2, notification.getRetryCount());

        assertNotNull(notification.getSentAt());
    }

    // Test 3: Third attempt succeeds

    @Test
    void emailShouldSucceedOnThirdAttempt() throws Exception {

        doThrow(new RuntimeException("First failure"))
                .doThrow(new RuntimeException("Second failure"))
                .doNothing()
                .when(emailService)
                .sendBookingConfirmation(
                        "test@example.com",
                        booking
                );

        deliveryService.deliver(1L);

        verify(emailService, times(3))
                .sendBookingConfirmation(
                        "test@example.com",
                        booking
                );

        assertEquals(
                EmailStatus.SENT,
                notification.getStatus()
        );

        assertEquals(3, notification.getRetryCount());

        assertNotNull(notification.getSentAt());
    }

    // Test 4: All attempts fail

    @Test
    void emailShouldStopAfterThreeFailures() throws Exception {

        doThrow(new RuntimeException("SMTP unavailable"))
                .when(emailService)
                .sendBookingConfirmation(
                        "test@example.com",
                        booking
                );

        deliveryService.deliver(1L);

        verify(emailService, times(3))
                .sendBookingConfirmation(
                        "test@example.com",
                        booking
                );

        assertEquals(
                EmailStatus.FAILED,
                notification.getStatus()
        );

        assertEquals(3, notification.getRetryCount());

        assertNotNull(notification.getNextRetryAt());

        assertEquals(
                "SMTP unavailable",
                notification.getLastError()
        );
    }

    // Test 5: Another worker already claimed the email

    @Test
    void shouldNotSendEmailWhenClaimFails() throws Exception {

        when(claimService.claim(1L)).thenReturn(false);

        deliveryService.deliver(1L);

        verifyNoInteractions(emailService);

        verify(notificationRepository, never())
                .save(any(EmailNotification.class));

        assertEquals(
                EmailStatus.PENDING,
                notification.getStatus()
        );
    }
}