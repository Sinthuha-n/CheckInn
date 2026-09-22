package com.checkinn.controller;

import com.checkinn.dto.BookingRequest;
import com.checkinn.dto.BookingResponse;
import com.checkinn.service.BookingService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "http://localhost:5173")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(
            BookingService bookingService
    ) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public BookingResponse createBooking(
            @RequestBody BookingRequest request,
            Authentication authentication
    ) {

        String email = authentication.getName();

        return bookingService.createBooking(
                request,
                email
        );
    }
}
