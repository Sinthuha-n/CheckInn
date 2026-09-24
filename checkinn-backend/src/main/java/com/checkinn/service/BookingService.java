package com.checkinn.service;

import com.checkinn.dto.BookingRequest;
import com.checkinn.dto.BookingResponse;
import com.checkinn.entity.Booking;
import com.checkinn.entity.Room;
import com.checkinn.entity.User;
import com.checkinn.enums.BookingStatus;
import com.checkinn.exception.BadRequestException;
import com.checkinn.exception.ConflictException;
import com.checkinn.exception.ResourceNotFoundException;
import com.checkinn.repository.BookingRepository;
import com.checkinn.repository.RoomRepository;
import com.checkinn.repository.UserRepository;
import org.springframework.stereotype.Service;
import com.checkinn.exception.ForbiddenException;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public BookingService(
            BookingRepository bookingRepository,
            RoomRepository roomRepository,
            UserRepository userRepository,
            EmailService emailService
    ) {
        this.bookingRepository = bookingRepository;
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    public BookingResponse createBooking(
            BookingRequest request,
            String userEmail
    ) {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found")
                );

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Room not found")
                );

        validateBooking(request, room);

        List<Booking> overlappingBookings =
                bookingRepository.findOverlappingBookings(
                        room.getId(),
                        request.getCheckInDate(),
                        request.getCheckOutDate()
                );

        if (!overlappingBookings.isEmpty()) {
            throw new ConflictException(
                    "Room is not available for selected dates"
            );
        }

        long numberOfNights = ChronoUnit.DAYS.between(
                request.getCheckInDate(),
                request.getCheckOutDate()
        );

        BigDecimal totalPrice =
                room.getPricePerNight()
                        .multiply(BigDecimal.valueOf(numberOfNights));

        Booking booking = new Booking();

        booking.setUser(user);
        booking.setRoom(room);
        booking.setCheckInDate(request.getCheckInDate());
        booking.setCheckOutDate(request.getCheckOutDate());
        booking.setNumberOfGuests(request.getNumberOfGuests());
        booking.setTotalPrice(totalPrice);
        booking.setStatus(BookingStatus.CONFIRMED);

        Booking savedBooking =
                bookingRepository.save(booking);

        try {
            emailService.sendBookingConfirmation(
                    user.getEmail(),
                    savedBooking
            );
        } catch (Exception e) {
            System.out.println(
                    "Failed to send booking confirmation email: "
                            + e.getMessage()
            );
        }

        return convertToResponse(savedBooking);
    }

    private void validateBooking(
            BookingRequest request,
            Room room
    ) {

        if (request.getCheckInDate() == null ||
                request.getCheckOutDate() == null) {

            throw new BadRequestException(
                    "Check-in and check-out dates are required"
            );
        }

        if (!request.getCheckOutDate()
                .isAfter(request.getCheckInDate())) {

            throw new BadRequestException(
                    "Check-out date must be after check-in date"
            );
        }

        if (request.getCheckInDate()
                .isBefore(LocalDate.now())) {

            throw new BadRequestException(
                    "Check-in date cannot be in the past"
            );
        }

        if (request.getNumberOfGuests() == null ||
                request.getNumberOfGuests() <= 0) {

            throw new BadRequestException(
                    "Number of guests must be greater than zero"
            );
        }

        if (request.getNumberOfGuests() > room.getCapacity()) {

            throw new BadRequestException(
                    "Number of guests exceeds room capacity"
            );
        }
    }

    private BookingResponse convertToResponse(Booking booking) {

        return new BookingResponse(
                booking.getId(),
                booking.getUser().getName(),
                booking.getRoom().getId(),
                booking.getRoom().getRoomNumber(),
                booking.getRoom().getRoomType(),
                booking.getRoom().getPricePerNight(),
                booking.getCheckInDate(),
                booking.getCheckOutDate(),
                booking.getNumberOfGuests(),
                booking.getTotalPrice(),
                booking.getStatus().name()
        );
    }

    public List<BookingResponse> getMyBookings(String userEmail) {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found")
                );

        return bookingRepository.findByUserId(user.getId())
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    public BookingResponse cancelBooking(
            Long bookingId,
            String userEmail
    ) {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found")
                );

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Booking not found")
                );

        if (!booking.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException(
                    "You cannot cancel this booking"
            );
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new ConflictException(
                    "Booking is already cancelled"
            );
        }

        booking.setStatus(BookingStatus.CANCELLED);

        Booking savedBooking =
                bookingRepository.save(booking);

        return convertToResponse(savedBooking);
    }

    public List<BookingResponse> getAllBookings() {

        return bookingRepository.findAll()
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    public Booking getBookingForUser(
            Long bookingId,
            String userEmail
    ) {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found")
                );

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Booking not found")
                );

        if (!booking.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException(
                    "You cannot access this booking"
            );
        }

        return booking;
    }
}