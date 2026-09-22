package com.checkinn.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class BookingResponse {

    private Long id;
    private Long roomId;
    private String roomNumber;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private Integer numberOfGuests;
    private BigDecimal totalPrice;
    private String status;

    public BookingResponse(
            Long id,
            Long roomId,
            String roomNumber,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            Integer numberOfGuests,
            BigDecimal totalPrice,
            String status
    ) {
        this.id = id;
        this.roomId = roomId;
        this.roomNumber = roomNumber;
        this.checkInDate = checkInDate;
        this.checkOutDate = checkOutDate;
        this.numberOfGuests = numberOfGuests;
        this.totalPrice = totalPrice;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public Long getRoomId() {
        return roomId;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public LocalDate getCheckInDate() {
        return checkInDate;
    }

    public LocalDate getCheckOutDate() {
        return checkOutDate;
    }

    public Integer getNumberOfGuests() {
        return numberOfGuests;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public String getStatus() {
        return status;
    }
}
