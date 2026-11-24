
package com.checkinn;

import com.checkinn.entity.Booking;
import com.checkinn.entity.Room;
import com.checkinn.entity.User;
import com.checkinn.enums.BookingStatus;
import com.checkinn.enums.Role;
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
        when(currentUser.getRole()).thenReturn(Role.USER);

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

    @Test
    void shouldAllowAdminToCancelAnotherUsersBooking() {
        User adminUser = mock(User.class);
        when(adminUser.getId()).thenReturn(1L);
        when(adminUser.getRole()).thenReturn(Role.ADMIN);

        User bookingOwner = mock(User.class);
        when(bookingOwner.getId()).thenReturn(2L);
        when(bookingOwner.getName()).thenReturn("Owner");

        Room room = mock(Room.class);
        when(room.getId()).thenReturn(5L);

        Booking booking = new Booking();
        booking.setUser(bookingOwner);
        booking.setRoom(room);
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setCheckInDate(LocalDate.now().plusDays(3));
        booking.setCheckOutDate(LocalDate.now().plusDays(6));

        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(adminUser));
        when(bookingRepository.findById(10L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        bookingService.cancelBooking(10L, "admin@example.com");

        assertEquals(BookingStatus.CANCELLED, booking.getStatus());
        verify(bookingRepository, times(1)).save(booking);
    }

    @Test
    void shouldPreventAccessingAnotherUsersBooking() {
        User currentUser = mock(User.class);
        when(currentUser.getId()).thenReturn(1L);
        when(currentUser.getRole()).thenReturn(Role.USER);

        User bookingOwner = mock(User.class);
        when(bookingOwner.getId()).thenReturn(2L);

        Booking booking = new Booking();
        booking.setUser(bookingOwner);

        when(userRepository.findByEmail("user1@example.com")).thenReturn(Optional.of(currentUser));
        when(bookingRepository.findById(10L)).thenReturn(Optional.of(booking));

        ForbiddenException exception = assertThrows(
                ForbiddenException.class,
                () -> bookingService.getBookingForUser(10L, "user1@example.com")
        );

        assertEquals("You cannot access this booking", exception.getMessage());
    }

    @Test
    void shouldAllowAdminToAccessAnotherUsersBooking() {
        User adminUser = mock(User.class);
        when(adminUser.getId()).thenReturn(1L);
        when(adminUser.getRole()).thenReturn(Role.ADMIN);

        User bookingOwner = mock(User.class);
        when(bookingOwner.getId()).thenReturn(2L);

        Booking booking = new Booking();
        booking.setUser(bookingOwner);

        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(adminUser));
        when(bookingRepository.findById(10L)).thenReturn(Optional.of(booking));

        Booking result = bookingService.getBookingForUser(10L, "admin@example.com");

        assertSame(booking, result);
    }
}