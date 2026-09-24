
package com.checkinn;

import com.checkinn.entity.Booking;
import com.checkinn.entity.EmailNotification;
import com.checkinn.entity.User;
import com.checkinn.enums.EmailStatus;
import com.checkinn.event.BookingConfirmedEvent;
import com.checkinn.event.BookingEmailListener;
import com.checkinn.repository.BookingRepository;
import com.checkinn.repository.EmailNotificationRepository;
import com.checkinn.service.EmailService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class BookingEmailRetryTest {

    private BookingRepository bookingRepository;
    private EmailService emailService;
    private EmailNotificationRepository notificationRepository;
    private BookingEmailListener listener;

    private Booking booking;
    private EmailNotification notification;

    @BeforeEach
    void setUp() {

        bookingRepository = mock(BookingRepository.class);
        emailService = mock(EmailService.class);
        notificationRepository =
                mock(EmailNotificationRepository.class);

        listener = new BookingEmailListener(
                bookingRepository,
                emailService,
                notificationRepository
        );

        User user = new User();
        user.setEmail("test@example.com");

        booking = mock(Booking.class);
        when(booking.getId()).thenReturn(1L);
        when(booking.getUser()).thenReturn(user);
        booking.setUser(user);

        notification = new EmailNotification();
        notification.setBookingId(1L);
        notification.setStatus(EmailStatus.PENDING);

        when(bookingRepository.findById(1L))
                .thenReturn(Optional.of(booking));

        when(notificationRepository.findByBookingId(1L))
                .thenReturn(Optional.of(notification));
    }

    @Test
    void emailShouldSendOnFirstAttempt() throws Exception {

        listener.sendConfirmation(
                new BookingConfirmedEvent(1L)
        );

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
    }

    @Test
    void emailShouldRetryAfterFirstFailure() throws Exception {

        doThrow(new RuntimeException("SMTP unavailable"))
                .doNothing()
                .when(emailService)
                .sendBookingConfirmation(
                        "test@example.com",
                        booking
                );

        listener.sendConfirmation(
                new BookingConfirmedEvent(1L)
        );

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
    }

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

        listener.sendConfirmation(
                new BookingConfirmedEvent(1L)
        );

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
    }

    @Test
    void emailShouldStopAfterThreeFailures() throws Exception {

        doThrow(new RuntimeException("SMTP unavailable"))
                .when(emailService)
                .sendBookingConfirmation(
                        "test@example.com",
                        booking
                );

        listener.sendConfirmation(
                new BookingConfirmedEvent(1L)
        );

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
    }
}