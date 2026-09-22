package com.checkinn.controller;

import com.checkinn.dto.BookingRequest;
import com.checkinn.dto.BookingResponse;
import com.checkinn.service.BookingService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "http://localhost:5173")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public BookingResponse createBooking(
            @RequestBody BookingRequest request,
            Authentication authentication
    ) {

        return bookingService.createBooking(
                request,
                authentication.getName()
        );
    }

    @GetMapping("/my")
    public List<BookingResponse> getMyBookings(
            Authentication authentication
    ) {

        return bookingService.getMyBookings(
                authentication.getName()
        );
    }

    @PutMapping("/{id}/cancel")
    public BookingResponse cancelBooking(
            @PathVariable Long id,
            Authentication authentication
    ) {

        return bookingService.cancelBooking(
                id,
                authentication.getName()
        );
    }

    @GetMapping
    public List<BookingResponse> getAllBookings() {
        return bookingService.getAllBookings();
    }
}