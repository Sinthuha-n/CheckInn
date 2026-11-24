
package com.checkinn;

import com.checkinn.entity.Booking;
import com.checkinn.entity.Room;
import com.checkinn.entity.User;
import com.checkinn.enums.BookingStatus;
import com.checkinn.enums.Role;
import com.checkinn.exception.BadRequestException;
import com.checkinn.exception.ConflictException;
import com.checkinn.exception.ForbiddenException;
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
        owner.setRole(Role.USER);

        Room room = mock(Room.class);
        when(room.getId()).thenReturn(10L);

        booking = new Booking();
        booking.setUser(owner);
        booking.setRoom(room);
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setCheckInDate(LocalDate.now().plusDays(5));
        booking.setCheckOutDate(LocalDate.now().plusDays(8));

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
        anotherUser.setRole(Role.USER);

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

        ConflictException ex = assertThrows(
                ConflictException.class,
                () -> bookingService.cancelBooking(
                        100L,
                        "owner@example.com"
                )
        );

        assertEquals("Booking is already cancelled", ex.getMessage());

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

    @Test
    void shouldRejectCancellationOfPastBooking() {
        LocalDate today = LocalDate.now();
        booking.setCheckInDate(today.minusDays(7));
        booking.setCheckOutDate(today.minusDays(2));

        when(userRepository.findByEmail("owner@example.com"))
                .thenReturn(Optional.of(owner));

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> bookingService.cancelBooking(100L, "owner@example.com")
        );

        assertEquals("Cannot cancel a past booking", ex.getMessage());
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void shouldRejectCancellationOfActiveBooking() {
        LocalDate today = LocalDate.now();
        booking.setCheckInDate(today);
        booking.setCheckOutDate(today.plusDays(3));

        when(userRepository.findByEmail("owner@example.com"))
                .thenReturn(Optional.of(owner));

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> bookingService.cancelBooking(100L, "owner@example.com")
        );

        assertEquals("Cannot cancel a booking that has already started", ex.getMessage());
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void shouldRejectCancellationOfCompletedBooking() {
        booking.setStatus(BookingStatus.COMPLETED);

        when(userRepository.findByEmail("owner@example.com"))
                .thenReturn(Optional.of(owner));

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> bookingService.cancelBooking(100L, "owner@example.com")
        );

        assertEquals("Cannot cancel a completed booking", ex.getMessage());
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void shouldAllowCancellationByAdmin() {
        User admin = new User();
        admin.setId(99L);
        admin.setEmail("admin@example.com");
        admin.setRole(Role.ADMIN);

        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(admin));

        bookingService.cancelBooking(100L, "admin@example.com");

        assertEquals(BookingStatus.CANCELLED, booking.getStatus());
        verify(bookingRepository, times(1)).save(booking);
    }
}
