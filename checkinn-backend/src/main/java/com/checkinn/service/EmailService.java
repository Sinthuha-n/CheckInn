package com.checkinn.service;

import com.checkinn.entity.Booking;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final PdfService pdfService;

    public EmailService(
            JavaMailSender mailSender,
            PdfService pdfService
    ) {
        this.mailSender = mailSender;
        this.pdfService = pdfService;
    }

    public void sendBookingConfirmation(
            String email,
            Booking booking
    ) throws MessagingException, IOException {

        byte[] pdfBytes =
                pdfService.generateBookingTicket(booking);

        MimeMessage message =
                mailSender.createMimeMessage();

        MimeMessageHelper helper =
                new MimeMessageHelper(
                        message,
                        true
                );

        helper.setTo(email);

        helper.setSubject(
                "CheckINN Booking Confirmation"
        );

        helper.setText(
                "Your booking has been confirmed.\n\n" +
                        "Booking ID: " + booking.getId() + "\n" +
                        "Room: " + booking.getRoom().getRoomNumber() + "\n" +
                        "Room Type: " + booking.getRoom().getRoomType() + "\n" +
                        "Check-in: " + booking.getCheckInDate() + "\n" +
                        "Check-out: " + booking.getCheckOutDate() + "\n" +
                        "Guests: " + booking.getNumberOfGuests() + "\n" +
                        "Total Price: LKR " + booking.getTotalPrice() + "\n" +
                        "Status: " + booking.getStatus() + "\n\n" +
                        "Your booking ticket is attached."
        );

        helper.addAttachment(
                "booking-" + booking.getId() + ".pdf",
                new ByteArrayResource(pdfBytes)
        );

        mailSender.send(message);
    }
}