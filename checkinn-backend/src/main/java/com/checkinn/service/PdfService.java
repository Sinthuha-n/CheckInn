package com.checkinn.service;

import com.checkinn.entity.Booking;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class PdfService {

    public byte[] generateBookingTicket(Booking booking) throws IOException {

        try (
                PDDocument document = new PDDocument();
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream()
        ) {

            PDPage page = new PDPage();
            document.addPage(page);

            PDType1Font titleFont =
                    new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);

            PDType1Font normalFont =
                    new PDType1Font(Standard14Fonts.FontName.HELVETICA);

            try (PDPageContentStream content =
                         new PDPageContentStream(document, page)) {

                content.beginText();

                content.setFont(titleFont, 20);
                content.newLineAtOffset(200, 750);
                content.showText("CheckINN Booking Ticket");

                content.setFont(normalFont, 12);

                content.newLineAtOffset(-150, -50);
                content.showText("Booking ID: " + booking.getId());

                content.newLineAtOffset(0, -25);
                content.showText(
                        "Guest: " + booking.getUser().getName()
                );

                content.newLineAtOffset(0, -25);
                content.showText(
                        "Room Number: " +
                                booking.getRoom().getRoomNumber()
                );

                content.newLineAtOffset(0, -25);
                content.showText(
                        "Room Type: " +
                                booking.getRoom().getRoomType()
                );

                content.newLineAtOffset(0, -25);
                content.showText(
                        "Check-in: " +
                                booking.getCheckInDate()
                );

                content.newLineAtOffset(0, -25);
                content.showText(
                        "Check-out: " +
                                booking.getCheckOutDate()
                );

                content.newLineAtOffset(0, -25);
                content.showText(
                        "Guests: " +
                                booking.getNumberOfGuests()
                );

                content.newLineAtOffset(0, -25);
                content.showText(
                        "Total Price: LKR " +
                                booking.getTotalPrice()
                );

                content.newLineAtOffset(0, -25);
                content.showText(
                        "Status: " +
                                booking.getStatus()
                );

                content.endText();
            }

            document.save(outputStream);

            return outputStream.toByteArray();
        }
    }
}
