package com.checkinn.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class BookingResponse {

    private Long id;
    private String userName;
    private Long roomId;
    private String roomNumber;
    private String roomType;
    private BigDecimal pricePerNight;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private Integer numberOfGuests;
    private BigDecimal totalPrice;
    private String status;

    public BookingResponse(
            Long id,
            String userName,
            Long roomId,
            String roomNumber,
            String roomType,
            BigDecimal pricePerNight,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            Integer numberOfGuests,
            BigDecimal totalPrice,
            String status
    ) {
        this.id = id;
        this.userName = userName;
        this.roomId = roomId;
        this.roomNumber = roomNumber;
        this.roomType = roomType;
        this.pricePerNight = pricePerNight;
        this.checkInDate = checkInDate;
        this.checkOutDate = checkOutDate;
        this.numberOfGuests = numberOfGuests;
        this.totalPrice = totalPrice;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public String getUserName() {
        return userName;
    }

    public Long getRoomId() {
        return roomId;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public String getRoomType() {
        return roomType;
    }

    public BigDecimal getPricePerNight() {
        return pricePerNight;
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