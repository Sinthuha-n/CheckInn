package com.checkinn;

import com.checkinn.dto.RoomRequest;
import com.checkinn.dto.RoomResponse;
import com.checkinn.entity.Room;
import com.checkinn.exception.BadRequestException;
import com.checkinn.exception.ResourceNotFoundException;
import com.checkinn.repository.RoomRepository;
import com.checkinn.service.RoomService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RoomServiceTest {

    @Test
    void createRoomMapsRequestToEntityAndReturnsResponse() {
        RoomRepository repository = mock(RoomRepository.class);
        RoomService service = new RoomService(repository);

        RoomRequest request = new RoomRequest(
                "102",
                "Single Room",
                "Single room description",
                new BigDecimal("12000"),
                1,
                true,
                "1 Single Bed",
                List.of("Free Wi-Fi", "Work desk")
        );

        when(repository.save(any(Room.class))).thenAnswer(invocation -> {
            Room saved = invocation.getArgument(0);
            saved.setId(10L);
            return saved;
        });

        RoomResponse response = service.createRoom(request);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("102", response.getRoomNumber());
        assertEquals("Single Room", response.getRoomType());
        assertEquals("Single room description", response.getDescription());
        assertEquals(new BigDecimal("12000"), response.getPricePerNight());
        assertEquals(1, response.getCapacity());
        assertTrue(response.getAvailable());
        assertEquals("1 Single Bed", response.getBedConfiguration());
        assertEquals(List.of("Free Wi-Fi", "Work desk"), response.getAmenities());

        ArgumentCaptor<Room> captor = ArgumentCaptor.forClass(Room.class);
        verify(repository).save(captor.capture());
        Room captured = captor.getValue();
        assertEquals("102", captured.getRoomNumber());
        assertEquals(1, captured.getCapacity());
    }

    @Test
    void updateRoomCopiesBedConfigurationAndAmenities() {
        RoomRepository repository = mock(RoomRepository.class);
        RoomService service = new RoomService(repository);
        Room existingRoom = room("101", "Single Room");
        RoomRequest request = new RoomRequest();
        request.setRoomNumber("101");
        request.setRoomType("Deluxe Single Room");
        request.setDescription("A room description.");
        request.setPricePerNight(new BigDecimal("15000"));
        request.setCapacity(2);
        request.setAvailable(true);
        request.setBedConfiguration("1 Queen Bed");
        request.setAmenities(List.of(
                "Free Wi-Fi",
                "Air conditioning",
                "Work desk"
        ));

        when(repository.findById(1L)).thenReturn(Optional.of(existingRoom));
        when(repository.save(existingRoom)).thenReturn(existingRoom);

        RoomResponse result = service.updateRoom(1L, request);

        assertEquals("1 Queen Bed", result.getBedConfiguration());
        assertEquals(request.getAmenities(), result.getAmenities());
        assertNotSame(request.getAmenities(), existingRoom.getAmenities());
        verify(repository).save(existingRoom);
    }

    @Test
    void getRoomByIdReturnsRoomResponse() {
        RoomRepository repository = mock(RoomRepository.class);
        RoomService service = new RoomService(repository);
        Room existingRoom = room("201", "Deluxe Double");
        existingRoom.setId(5L);

        when(repository.findById(5L)).thenReturn(Optional.of(existingRoom));

        RoomResponse response = service.getRoomById(5L);

        assertEquals(5L, response.getId());
        assertEquals("201", response.getRoomNumber());
        assertEquals("Deluxe Double", response.getRoomType());
    }

    @Test
    void getRoomByIdThrowsResourceNotFoundExceptionWhenMissing() {
        RoomRepository repository = mock(RoomRepository.class);
        RoomService service = new RoomService(repository);
        when(repository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(
                ResourceNotFoundException.class,
                () -> service.getRoomById(99L)
        );
        assertEquals("Room not found", ex.getMessage());
    }

    @Test
    void getAllRoomsReturnsListOfRoomResponses() {
        RoomRepository repository = mock(RoomRepository.class);
        RoomService service = new RoomService(repository);
        Room room1 = room("101", "Single");
        Room room2 = room("102", "Double");

        when(repository.findAll()).thenReturn(List.of(room1, room2));

        List<RoomResponse> responses = service.getAllRooms();

        assertEquals(2, responses.size());
        assertEquals("101", responses.get(0).getRoomNumber());
        assertEquals("102", responses.get(1).getRoomNumber());
    }

    @Test
    void deleteRoomCallsRepositoryWhenExists() {
        RoomRepository repository = mock(RoomRepository.class);
        RoomService service = new RoomService(repository);
        when(repository.existsById(3L)).thenReturn(true);

        service.deleteRoom(3L);

        verify(repository).deleteById(3L);
    }

    @Test
    void deleteRoomThrowsResourceNotFoundExceptionWhenMissing() {
        RoomRepository repository = mock(RoomRepository.class);
        RoomService service = new RoomService(repository);
        when(repository.existsById(99L)).thenReturn(false);

        ResourceNotFoundException ex = assertThrows(
                ResourceNotFoundException.class,
                () -> service.deleteRoom(99L)
        );
        assertEquals("Room not found", ex.getMessage());
        verify(repository, never()).deleteById(anyLong());
    }

    @Test
    void getAvailableRoomsValidatesDates() {
        RoomRepository repository = mock(RoomRepository.class);
        RoomService service = new RoomService(repository);

        assertThrows(BadRequestException.class, () -> service.getAvailableRooms(null, LocalDate.now().plusDays(2)));
        assertThrows(BadRequestException.class, () -> service.getAvailableRooms(LocalDate.now().plusDays(2), null));
        assertThrows(BadRequestException.class, () -> service.getAvailableRooms(LocalDate.now().plusDays(3), LocalDate.now().plusDays(2)));
        assertThrows(BadRequestException.class, () -> service.getAvailableRooms(LocalDate.now().minusDays(1), LocalDate.now().plusDays(2)));
    }

    @Test
    void searchRoomsValidatesParameters() {
        RoomRepository repository = mock(RoomRepository.class);
        RoomService service = new RoomService(repository);

        assertThrows(BadRequestException.class, () -> service.searchRooms("Deluxe", 0, new BigDecimal("10000")));
        assertThrows(BadRequestException.class, () -> service.searchRooms("Deluxe", -1, new BigDecimal("10000")));
        assertThrows(BadRequestException.class, () -> service.searchRooms("Deluxe", 2, BigDecimal.ZERO));
        assertThrows(BadRequestException.class, () -> service.searchRooms("Deluxe", 2, new BigDecimal("-500")));
    }

    private static Room room(String roomNumber, String roomType) {
        Room room = new Room();
        room.setId(1L);
        room.setRoomNumber(roomNumber);
        room.setRoomType(roomType);
        room.setDescription("A room description.");
        room.setPricePerNight(new BigDecimal("15000"));
        room.setCapacity(2);
        room.setAvailable(true);
        return room;
    }
}
