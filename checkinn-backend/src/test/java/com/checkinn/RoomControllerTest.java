package com.checkinn;

import com.checkinn.controller.RoomController;
import com.checkinn.dto.RoomRequest;
import com.checkinn.dto.RoomResponse;
import com.checkinn.exception.GlobalExceptionHandler;
import com.checkinn.service.RoomService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class RoomControllerTest {

    private RoomService roomService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        roomService = mock(RoomService.class);
        RoomController roomController = new RoomController(roomService);
        mockMvc = MockMvcBuilders.standaloneSetup(roomController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void createRoomReturnsRoomResponseOnValidRequest() throws Exception {
        RoomResponse response = new RoomResponse(
                1L,
                "101",
                "Deluxe",
                "A deluxe room",
                new BigDecimal("15000"),
                2,
                true,
                "1 Queen Bed",
                List.of("Free Wi-Fi")
        );

        when(roomService.createRoom(any(RoomRequest.class))).thenReturn(response);

        String validJson = """
                {
                    "roomNumber": "101",
                    "roomType": "Deluxe",
                    "description": "A deluxe room",
                    "pricePerNight": 15000,
                    "capacity": 2,
                    "available": true,
                    "bedConfiguration": "1 Queen Bed",
                    "amenities": ["Free Wi-Fi"]
                }
                """;

        mockMvc.perform(post("/api/rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.roomNumber").value("101"))
                .andExpect(jsonPath("$.roomType").value("Deluxe"))
                .andExpect(jsonPath("$.pricePerNight").value(15000))
                .andExpect(jsonPath("$.capacity").value(2))
                .andExpect(jsonPath("$.available").value(true));
    }

    @Test
    void createRoomRejectsInvalidPayloadWithBadRequest() throws Exception {
        String invalidJson = """
                {
                    "roomNumber": "",
                    "roomType": "",
                    "pricePerNight": -500,
                    "capacity": 0,
                    "available": null
                }
                """;

        mockMvc.perform(post("/api/rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.roomNumber").exists())
                .andExpect(jsonPath("$.roomType").exists())
                .andExpect(jsonPath("$.pricePerNight").exists())
                .andExpect(jsonPath("$.capacity").exists())
                .andExpect(jsonPath("$.available").exists());
    }

    @Test
    void updateRoomReturnsRoomResponseOnValidRequest() throws Exception {
        RoomResponse response = new RoomResponse(
                1L,
                "101",
                "Suite",
                "Updated description",
                new BigDecimal("20000"),
                3,
                true,
                "1 King Bed",
                List.of("Free Wi-Fi", "Mini fridge")
        );

        when(roomService.updateRoom(eq(1L), any(RoomRequest.class))).thenReturn(response);

        String validJson = """
                {
                    "roomNumber": "101",
                    "roomType": "Suite",
                    "description": "Updated description",
                    "pricePerNight": 20000,
                    "capacity": 3,
                    "available": true,
                    "bedConfiguration": "1 King Bed",
                    "amenities": ["Free Wi-Fi", "Mini fridge"]
                }
                """;

        mockMvc.perform(put("/api/rooms/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomType").value("Suite"))
                .andExpect(jsonPath("$.capacity").value(3))
                .andExpect(jsonPath("$.pricePerNight").value(20000));
    }

    @Test
    void getRoomByIdReturnsRoomResponse() throws Exception {
        RoomResponse response = new RoomResponse(
                1L,
                "101",
                "Deluxe",
                "A deluxe room",
                new BigDecimal("15000"),
                2,
                true,
                "1 Queen Bed",
                List.of()
        );

        when(roomService.getRoomById(1L)).thenReturn(response);

        mockMvc.perform(get("/api/rooms/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.roomNumber").value("101"));
    }

    @Test
    void getAllRoomsReturnsListOfRoomResponses() throws Exception {
        RoomResponse response = new RoomResponse(
                1L,
                "101",
                "Deluxe",
                "A deluxe room",
                new BigDecimal("15000"),
                2,
                true,
                "1 Queen Bed",
                List.of()
        );

        when(roomService.getAllRooms()).thenReturn(List.of(response));

        mockMvc.perform(get("/api/rooms"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].roomNumber").value("101"));
    }
}
