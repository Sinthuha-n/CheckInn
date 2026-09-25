
package com.checkinn;

import com.checkinn.entity.Booking;
import com.checkinn.entity.Room;
import com.checkinn.entity.User;
import com.checkinn.enums.BookingStatus;
import com.checkinn.exception.ConflictException;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class BookingCancellationTest {

    private BookingRepository bookingRepository;
    private RoomRepository roomRepository;
    private UserRepository userRepository;
    private ApplicationEventPublisher eventPublisher;

    private BookingService bookingService;

    private User owner;
    private Booking booking;

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

        owner = new User();
        owner.setId(1L);
        owner.setEmail("owner@example.com");

        Room room = mock(Room.class);
        when(room.getId()).thenReturn(10L);

        booking = new Booking();
        booking.setUser(owner);
        booking.setRoom(room);
        booking.setStatus(BookingStatus.CONFIRMED);

        when(bookingRepository.findById(100L))
                .thenReturn(Optional.of(booking));

        when(bookingRepository.save(any(Booking.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0)
                );
    }

    @Test
    void shouldRejectCancellationByAnotherUser() {

        User anotherUser = new User();
        anotherUser.setId(2L);
        anotherUser.setEmail("another@example.com");

        when(userRepository.findByEmail(
                "another@example.com"
        )).thenReturn(Optional.of(anotherUser));

        assertThrows(
                ForbiddenException.class,
                () -> bookingService.cancelBooking(
                        100L,
                        "another@example.com"
                )
        );

        assertEquals(
                BookingStatus.CONFIRMED,
                booking.getStatus()
        );

        verify(bookingRepository, never())
                .save(any(Booking.class));
    }

    @Test
    void shouldRejectRepeatedCancellation() {

        booking.setStatus(BookingStatus.CANCELLED);

        when(userRepository.findByEmail(
                "owner@example.com"
        )).thenReturn(Optional.of(owner));

        assertThrows(
                ConflictException.class,
                () -> bookingService.cancelBooking(
                        100L,
                        "owner@example.com"
                )
        );

        verify(bookingRepository, never())
                .save(any(Booking.class));
    }

    @Test
    void shouldCancelConfirmedBookingForOwner() {

        when(userRepository.findByEmail(
                "owner@example.com"
        )).thenReturn(Optional.of(owner));

        bookingService.cancelBooking(
                100L,
                "owner@example.com"
        );

        assertEquals(
                BookingStatus.CANCELLED,
                booking.getStatus()
        );

        verify(bookingRepository, times(1))
                .save(booking);
    }
}
