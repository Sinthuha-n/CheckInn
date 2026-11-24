package com.checkinn.dto;

import com.checkinn.entity.Room;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class RoomResponse {

    private Long id;
    private String roomNumber;
    private String roomType;
    private String description;
    private BigDecimal pricePerNight;
    private Integer capacity;
    private Boolean available;
    private String bedConfiguration;
    private List<String> amenities = new ArrayList<>();

    public RoomResponse() {
    }

    public RoomResponse(
            Long id,
            String roomNumber,
            String roomType,
            String description,
            BigDecimal pricePerNight,
            Integer capacity,
            Boolean available,
            String bedConfiguration,
            List<String> amenities
    ) {
        this.id = id;
        this.roomNumber = roomNumber;
        this.roomType = roomType;
        this.description = description;
        this.pricePerNight = pricePerNight;
        this.capacity = capacity;
        this.available = available;
        this.bedConfiguration = bedConfiguration;
        this.amenities = amenities != null ? new ArrayList<>(amenities) : new ArrayList<>();
    }

    public static RoomResponse fromEntity(Room room) {
        if (room == null) {
            return null;
        }
        return new RoomResponse(
                room.getId(),
                room.getRoomNumber(),
                room.getRoomType(),
                room.getDescription(),
                room.getPricePerNight(),
                room.getCapacity(),
                room.getAvailable(),
                room.getBedConfiguration(),
                room.getAmenities() != null ? new ArrayList<>(room.getAmenities()) : new ArrayList<>()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public String getRoomType() {
        return roomType;
    }

    public void setRoomType(String roomType) {
        this.roomType = roomType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPricePerNight() {
        return pricePerNight;
    }

    public void setPricePerNight(BigDecimal pricePerNight) {
        this.pricePerNight = pricePerNight;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public Boolean getAvailable() {
        return available;
    }

    public void setAvailable(Boolean available) {
        this.available = available;
    }

    public String getBedConfiguration() {
        return bedConfiguration;
    }

    public void setBedConfiguration(String bedConfiguration) {
        this.bedConfiguration = bedConfiguration;
    }

    public List<String> getAmenities() {
        if (amenities == null) {
            amenities = new ArrayList<>();
        }
        return amenities;
    }

    public void setAmenities(List<String> amenities) {
        this.amenities = amenities != null ? new ArrayList<>(amenities) : new ArrayList<>();
    }
}
