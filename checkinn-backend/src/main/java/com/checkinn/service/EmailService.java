package com.checkinn.service;

import com.checkinn.entity.Booking;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendBookingConfirmation(
            String email,
            Booking booking
    ) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(email);
        message.setSubject("CheckINN Booking Confirmation");

        message.setText(
                "Your booking has been confirmed.\n\n" +
                        "Booking ID: " + booking.getId() + "\n" +
                        "Room: " + booking.getRoom().getRoomNumber() + "\n" +
                        "Room Type: " + booking.getRoom().getRoomType() + "\n" +
                        "Check-in: " + booking.getCheckInDate() + "\n" +
                        "Check-out: " + booking.getCheckOutDate() + "\n" +
                        "Guests: " + booking.getNumberOfGuests() + "\n" +
                        "Total Price: LKR " + booking.getTotalPrice() + "\n" +
                        "Status: " + booking.getStatus()
        );

        mailSender.send(message);
    }
}
