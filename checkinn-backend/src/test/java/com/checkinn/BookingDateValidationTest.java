
package com.checkinn;

import com.checkinn.dto.BookingRequest;
import com.checkinn.entity.Booking;
import com.checkinn.entity.Room;
import com.checkinn.entity.User;
import com.checkinn.exception.BadRequestException;
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
import static org.mockito.Mockito.*;

class BookingDateValidationTest {

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
    void shouldRejectInvalidBookingDates() {

        // Create test user
        User user = new User();
        user.setEmail("test@example.com");

        // Create mock room
        Room room = mock(Room.class);

        when(room.getAvailable()).thenReturn(true);
        when(room.getCapacity()).thenReturn(2);

        // Check-out is earlier than check-in
        BookingRequest request = new BookingRequest();
        request.setRoomId(1L);
        request.setCheckInDate(LocalDate.now().plusDays(10));
        request.setCheckOutDate(LocalDate.now().plusDays(8));
        request.setNumberOfGuests(2);

        // Mock repository responses
        when(userRepository.findByEmail("test@example.com"))
                .thenReturn(Optional.of(user));

        when(roomRepository.findByIdForUpdate(1L))
                .thenReturn(Optional.of(room));

        // Run booking service and verify exception
        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> bookingService.createBooking(
                        request,
                        "test@example.com"
                )
        );

        assertEquals(
                "Check-out date must be after check-in date",
                exception.getMessage()
        );

        // Invalid booking must not be saved
        verify(bookingRepository, never())
                .save(any(Booking.class));

        // No confirmation email event
        verify(eventPublisher, never())
                .publishEvent(any(Object.class));
    }
}
