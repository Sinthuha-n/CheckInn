package com.checkinn.dto;

import java.time.LocalDateTime;

public class ReviewResponse {

    private Long id;
    private Long roomId;
    private Long bookingId;
    private String userName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;

    public ReviewResponse(
            Long id,
            Long roomId,
            Long bookingId,
            String userName,
            Integer rating,
            String comment,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.roomId = roomId;
        this.bookingId = bookingId;
        this.userName = userName;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
    }

    public ReviewResponse(
            Long id,
            Long roomId,
            String userName,
            Integer rating,
            String comment,
            LocalDateTime createdAt
    ) {
        this(id, roomId, null, userName, rating, comment, createdAt);
    }

    public Long getId() {
        return id;
    }

    public Long getRoomId() {
        return roomId;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public String getUserName() {
        return userName;
    }

    public Integer getRating() {
        return rating;
    }

    public String getComment() {
        return comment;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
