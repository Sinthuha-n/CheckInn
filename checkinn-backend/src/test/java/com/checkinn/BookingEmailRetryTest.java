
package com.checkinn;

import com.checkinn.entity.Booking;
import com.checkinn.entity.User;
import com.checkinn.event.BookingConfirmedEvent;
import com.checkinn.event.BookingEmailListener;
import com.checkinn.repository.BookingRepository;
import com.checkinn.service.EmailService;
import com.checkinn.service.PdfService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.mockito.Mockito.*;

class BookingEmailRetryTest {

    private BookingRepository bookingRepository;
    private EmailService emailService;
    private PdfService pdfService;
    private BookingEmailListener listener;

    private Booking booking;

    @BeforeEach
    void setUp() {

        bookingRepository = mock(BookingRepository.class);
        emailService = mock(EmailService.class);
        pdfService = mock(PdfService.class);

        listener = new BookingEmailListener(
                bookingRepository,
                emailService,
                pdfService
        );

        User user = new User();
        user.setEmail("test@example.com");

        booking = new Booking();
        booking.setUser(user);

        when(bookingRepository.findById(1L))
                .thenReturn(Optional.of(booking));
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
    }
}