package com.checkinn.service;

import com.checkinn.dto.RoomRequest;
import com.checkinn.dto.RoomResponse;
import com.checkinn.entity.Room;
import com.checkinn.exception.BadRequestException;
import com.checkinn.exception.ResourceNotFoundException;
import com.checkinn.repository.RoomRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class RoomService {

    private final RoomRepository roomRepository;

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    public RoomResponse createRoom(RoomRequest request) {
        Room room = toEntity(request);
        Room saved = roomRepository.save(room);
        return RoomResponse.fromEntity(saved);
    }

    public List<RoomResponse> getAllRooms() {
        return roomRepository.findAll().stream()
                .map(RoomResponse::fromEntity)
                .toList();
    }

    public RoomResponse getRoomById(Long id) {
        return RoomResponse.fromEntity(findRoomEntityById(id));
    }

    public Room findRoomEntityById(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));
    }

    public RoomResponse updateRoom(Long id, RoomRequest request) {
        Room room = findRoomEntityById(id);

        room.setRoomNumber(request.getRoomNumber());
        room.setRoomType(request.getRoomType());
        room.setDescription(request.getDescription());
        room.setPricePerNight(request.getPricePerNight());
        room.setCapacity(request.getCapacity());
        room.setAvailable(request.getAvailable());
        room.setBedConfiguration(request.getBedConfiguration());
        room.setAmenities(request.getAmenities());

        Room saved = roomRepository.save(room);
        return RoomResponse.fromEntity(saved);
    }

    public void deleteRoom(Long id) {
        if (!roomRepository.existsById(id)) {
            throw new ResourceNotFoundException("Room not found");
        }
        roomRepository.deleteById(id);
    }

    public List<RoomResponse> getAvailableRooms(
            LocalDate checkIn,
            LocalDate checkOut
    ) {

        if (checkIn == null || checkOut == null) {
            throw new BadRequestException(
                    "Check-in and check-out dates are required"
            );
        }

        if (!checkOut.isAfter(checkIn)) {
            throw new BadRequestException(
                    "Check-out date must be after check-in date"
            );
        }

        if (checkIn.isBefore(LocalDate.now())) {
            throw new BadRequestException(
                    "Check-in date cannot be in the past"
            );
        }

        return roomRepository.findAvailableRooms(
                checkIn,
                checkOut
        ).stream()
                .map(RoomResponse::fromEntity)
                .toList();
    }

    public List<RoomResponse> searchRooms(
            String roomType,
            Integer capacity,
            BigDecimal maxPrice
    ) {

        if (capacity != null && capacity <= 0) {
            throw new BadRequestException(
                    "Capacity must be greater than zero"
            );
        }

        if (maxPrice != null &&
                maxPrice.compareTo(BigDecimal.ZERO) <= 0) {

            throw new BadRequestException(
                    "Maximum price must be greater than zero"
            );
        }

        return roomRepository.searchRooms(
                roomType,
                capacity,
                maxPrice
        ).stream()
                .map(RoomResponse::fromEntity)
                .toList();
    }

    private Room toEntity(RoomRequest request) {
        Room room = new Room();
        room.setRoomNumber(request.getRoomNumber());
        room.setRoomType(request.getRoomType());
        room.setDescription(request.getDescription());
        room.setPricePerNight(request.getPricePerNight());
        room.setCapacity(request.getCapacity());
        room.setAvailable(request.getAvailable());
        room.setBedConfiguration(request.getBedConfiguration());
        room.setAmenities(request.getAmenities() != null
                ? new ArrayList<>(request.getAmenities())
                : new ArrayList<>());
        return room;
    }
}
