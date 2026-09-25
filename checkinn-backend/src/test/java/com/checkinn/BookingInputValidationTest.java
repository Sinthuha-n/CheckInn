
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

class BookingInputValidationTest {

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

        User user = new User();
        user.setEmail("test@example.com");

        Room room = mock(Room.class);

        when(room.getAvailable()).thenReturn(true);
        when(room.getCapacity()).thenReturn(2);

        when(userRepository.findByEmail("test@example.com"))
                .thenReturn(Optional.of(user));

        when(roomRepository.findByIdForUpdate(1L))
                .thenReturn(Optional.of(room));
    }

    private BookingRequest validRequest() {

        BookingRequest request = new BookingRequest();

        request.setRoomId(1L);
        request.setCheckInDate(LocalDate.now().plusDays(10));
        request.setCheckOutDate(LocalDate.now().plusDays(12));
        request.setNumberOfGuests(2);

        return request;
    }

    private void assertInvalid(BookingRequest request) {

        assertThrows(
                BadRequestException.class,
                () -> bookingService.createBooking(
                        request,
                        "test@example.com"
                )
        );

        verify(bookingRepository, never())
                .save(any(Booking.class));

        verifyNoInteractions(eventPublisher);
    }

    @Test
    void shouldRejectNullCheckInDate() {

        BookingRequest request = validRequest();
        request.setCheckInDate(null);

        assertInvalid(request);
    }

    @Test
    void shouldRejectNullCheckOutDate() {

        BookingRequest request = validRequest();
        request.setCheckOutDate(null);

        assertInvalid(request);
    }

    @Test
    void shouldRejectSameDayCheckout() {

        BookingRequest request = validRequest();

        request.setCheckOutDate(
                request.getCheckInDate()
        );

        assertInvalid(request);
    }

    @Test
    void shouldRejectZeroGuests() {

        BookingRequest request = validRequest();
        request.setNumberOfGuests(0);

        assertInvalid(request);
    }

    @Test
    void shouldRejectNegativeGuests() {

        BookingRequest request = validRequest();
        request.setNumberOfGuests(-2);

        assertInvalid(request);
    }

    @Test
    void shouldRejectNullGuestCount() {

        BookingRequest request = validRequest();
        request.setNumberOfGuests(null);

        assertInvalid(request);
    }
}