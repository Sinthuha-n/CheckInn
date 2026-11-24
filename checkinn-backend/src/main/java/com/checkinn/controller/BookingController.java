package com.checkinn.controller;

import com.checkinn.dto.BookingRequest;
import com.checkinn.dto.BookingResponse;
import com.checkinn.entity.Booking;
import com.checkinn.service.BookingService;
import com.checkinn.service.PdfService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "${frontend.url:http://localhost:5173}")
public class BookingController {

    private final BookingService bookingService;
    private final PdfService pdfService;

    public BookingController(
            BookingService bookingService,
            PdfService pdfService
    ) {
        this.bookingService = bookingService;
        this.pdfService = pdfService;
    }

    @PostMapping
    public BookingResponse createBooking(
            @Valid @RequestBody BookingRequest request,
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

    @GetMapping("/{id}/ticket")
    public ResponseEntity<byte[]> downloadTicket(
            @PathVariable Long id,
            Authentication authentication
    ) throws IOException {

        Booking booking =
                bookingService.getBookingForUser(
                        id,
                        authentication.getName()
                );

        byte[] pdf =
                pdfService.generateBookingTicket(booking);

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=booking-" + id + ".pdf"
                )
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}