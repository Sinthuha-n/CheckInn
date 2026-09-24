
package com.checkinn;

import com.checkinn.dto.BookingRequest;
import com.checkinn.entity.Booking;
import com.checkinn.entity.Room;
import com.checkinn.entity.User;
import com.checkinn.enums.BookingStatus;
import com.checkinn.exception.ConflictException;
import com.checkinn.repository.BookingRepository;
import com.checkinn.repository.RoomRepository;
import com.checkinn.repository.UserRepository;
import com.checkinn.service.BookingService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class BookingOverlapTest {

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
    void shouldRejectOverlappingBooking() {

        User user = new User();
        user.setEmail("test@example.com");

        Room room = mock(Room.class);

        when(room.getId()).thenReturn(1L);
        when(room.getCapacity()).thenReturn(2);

        BookingRequest request = new BookingRequest();
        request.setRoomId(1L);
        request.setCheckInDate(LocalDate.now().plusDays(10));
        request.setCheckOutDate(LocalDate.now().plusDays(13));
        request.setNumberOfGuests(2);

        when(userRepository.findByEmail("test@example.com"))
                .thenReturn(Optional.of(user));

        when(roomRepository.findByIdForUpdate(1L))
                .thenReturn(Optional.of(room));

        when(bookingRepository.findOverlappingBookings(
                eq(1L),
                any(LocalDate.class),
                any(LocalDate.class),
                eq(BookingStatus.CANCELLED)
        )).thenReturn(List.of(new Booking()));

        ConflictException exception = assertThrows(
                ConflictException.class,
                () -> bookingService.createBooking(
                        request,
                        "test@example.com"
                )
        );

        assertEquals(
                "Room is not available for selected dates",
                exception.getMessage()
        );

        verify(bookingRepository, never())
                .save(any(Booking.class));

        verify(eventPublisher, never())
                .publishEvent(any(Object.class));
    }
}
