
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

class BookingCapacityTest {

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
    void shouldRejectBookingWhenGuestsExceedCapacity() {

        // 1. Create test user
        User user = new User();
        user.setEmail("test@example.com");

        // 2. Create room with maximum capacity of 2
        Room room = mock(Room.class);
        when(room.getCapacity()).thenReturn(2);

        // 3. Request a booking for 4 guests
        BookingRequest request = new BookingRequest();
        request.setRoomId(1L);
        request.setCheckInDate(LocalDate.now().plusDays(10));
        request.setCheckOutDate(LocalDate.now().plusDays(13));
        request.setNumberOfGuests(4);

        // 4. Mock repository responses
        when(userRepository.findByEmail("test@example.com"))
                .thenReturn(Optional.of(user));

        when(roomRepository.findByIdForUpdate(1L))
                .thenReturn(Optional.of(room));

        // 5. Verify that booking is rejected
        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> bookingService.createBooking(
                        request,
                        "test@example.com"
                )
        );

        assertEquals(
                "Number of guests exceeds room capacity",
                exception.getMessage()
        );

        // 6. Booking must not be saved
        verify(bookingRepository, never())
                .save(any(Booking.class));

        // 7. Confirmation event must not be published
        verify(eventPublisher, never())
                .publishEvent(any(Object.class));
    }
}
