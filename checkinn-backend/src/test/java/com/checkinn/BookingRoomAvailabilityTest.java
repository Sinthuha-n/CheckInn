
package com.checkinn;

import com.checkinn.dto.BookingRequest;
import com.checkinn.entity.Booking;
import com.checkinn.entity.Room;
import com.checkinn.entity.User;
import com.checkinn.exception.ConflictException;
import com.checkinn.repository.BookingRepository;
import com.checkinn.repository.RoomRepository;
import com.checkinn.repository.UserRepository;
import com.checkinn.service.BookingService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class BookingRoomAvailabilityTest {

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
    void shouldRejectBookingForUnavailableRoom() {

        // Create test user
        User user = new User();
        user.setEmail("test@example.com");

        // Room is unavailable
        Room room = mock(Room.class);
        when(room.getAvailable()).thenReturn(false);

        // Create valid booking request
        BookingRequest request = new BookingRequest();
        request.setRoomId(1L);
        request.setCheckInDate(
                LocalDate.now().plusDays(10)
        );
        request.setCheckOutDate(
                LocalDate.now().plusDays(13)
        );
        request.setNumberOfGuests(2);

        // Mock repository responses
        when(userRepository.findByEmail(
                "test@example.com"
        )).thenReturn(Optional.of(user));

        when(roomRepository.findByIdForUpdate(1L))
                .thenReturn(Optional.of(room));

        // Booking must be rejected
        ConflictException exception = assertThrows(
                ConflictException.class,
                () -> bookingService.createBooking(
                        request,
                        "test@example.com"
                )
        );

        assertEquals(
                "This room is currently unavailable for booking",
                exception.getMessage()
        );

        // No booking should be saved
        verify(bookingRepository, never())
                .save(any(Booking.class));

        // No confirmation email event
        verify(eventPublisher, never())
                .publishEvent(any(Object.class));
    }
}
