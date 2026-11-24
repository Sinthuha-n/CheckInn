package com.checkinn.controller;

import com.checkinn.dto.RoomRequest;
import com.checkinn.dto.RoomResponse;
import com.checkinn.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "${frontend.url:http://localhost:5173}")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping
    public RoomResponse createRoom(@Valid @RequestBody RoomRequest request) {
        return roomService.createRoom(request);
    }

    @GetMapping
    public List<RoomResponse> getAllRooms() {
        return roomService.getAllRooms();
    }

    @GetMapping("/{id}")
    public RoomResponse getRoomById(@PathVariable Long id) {
        return roomService.getRoomById(id);
    }

    @PutMapping("/{id}")
    public RoomResponse updateRoom(
            @PathVariable Long id,
            @Valid @RequestBody RoomRequest request
    ) {
        return roomService.updateRoom(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteRoom(@PathVariable Long id) {
        roomService.deleteRoom(id);
    }

    @GetMapping("/available")
    public List<RoomResponse> getAvailableRooms(
            @RequestParam LocalDate checkIn,
            @RequestParam LocalDate checkOut
    ) {
        return roomService.getAvailableRooms(
                checkIn,
                checkOut
        );
    }

    @GetMapping("/search")
    public List<RoomResponse> searchRooms(
            @RequestParam(required = false) String roomType,
            @RequestParam(required = false) Integer capacity,
            @RequestParam(required = false) BigDecimal maxPrice
    ) {

        return roomService.searchRooms(
                roomType,
                capacity,
                maxPrice
        );
    }
}
