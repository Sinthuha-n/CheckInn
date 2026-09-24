
package com.checkinn;

import com.checkinn.entity.Booking;
import com.checkinn.entity.User;
import com.checkinn.enums.BookingStatus;
import com.checkinn.exception.ForbiddenException;
import com.checkinn.repository.BookingRepository;
import com.checkinn.repository.RoomRepository;
import com.checkinn.repository.UserRepository;
import com.checkinn.service.BookingService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class BookingAuthorizationTest {

    private BookingRepository bookingRepository;
    private RoomRepository roomRepository;
    private UserRepository userRepository;
    private ApplicationEventPublisher eventPublisher;

    private BookingService bookingService;

    @BeforeEach
    void setUp() {

        bookingRepository = mock(BookingRepository.class);
        roomRepository = mock(RoomRepository.class);
        userRepository = mock(UserRepository.class);
        eventPublisher = mock(ApplicationEventPublisher.class);

        bookingService = new BookingService(
                bookingRepository,
                roomRepository,
                userRepository,
                eventPublisher
        );
    }

    @Test
    void shouldPreventCancellingAnotherUsersBooking() {

        // Currently logged-in user
        User currentUser = mock(User.class);
        when(currentUser.getId()).thenReturn(1L);

        // Actual owner of the booking
        User bookingOwner = mock(User.class);
        when(bookingOwner.getId()).thenReturn(2L);

        // Booking belongs to another user
        Booking booking = new Booking();
        booking.setUser(bookingOwner);
        booking.setStatus(BookingStatus.CONFIRMED);

        // Mock repository responses
        when(userRepository.findByEmail("user1@example.com"))
                .thenReturn(Optional.of(currentUser));

        when(bookingRepository.findById(10L))
                .thenReturn(Optional.of(booking));

        // Verify access is denied
        ForbiddenException exception = assertThrows(
                ForbiddenException.class,
                () -> bookingService.cancelBooking(
                        10L,
                        "user1@example.com"
                )
        );

        assertEquals(
                "You cannot cancel this booking",
                exception.getMessage()
        );

        // Booking must not be modified or saved
        assertEquals(
                BookingStatus.CONFIRMED,
                booking.getStatus()
        );

        verify(bookingRepository, never())
                .save(any(Booking.class));

        verifyNoInteractions(eventPublisher);
    }
}