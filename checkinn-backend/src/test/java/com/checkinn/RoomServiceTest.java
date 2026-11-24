package com.checkinn;

import com.checkinn.entity.Room;
import com.checkinn.repository.RoomRepository;
import com.checkinn.service.RoomService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RoomServiceTest {

    @Test
    void updateRoomCopiesBedConfigurationAndAmenities() {
        RoomRepository repository = mock(RoomRepository.class);
        RoomService service = new RoomService(repository);
        Room existingRoom = room("101", "Single Room");
        Room updatedRoom = room("101", "Deluxe Single Room");
        updatedRoom.setBedConfiguration("1 Queen Bed");
        updatedRoom.setAmenities(List.of(
                "Free Wi-Fi",
                "Air conditioning",
                "Work desk"
        ));

        when(repository.findById(1L)).thenReturn(Optional.of(existingRoom));
        when(repository.save(existingRoom)).thenReturn(existingRoom);

        Room result = service.updateRoom(1L, updatedRoom);

        assertEquals("1 Queen Bed", result.getBedConfiguration());
        assertEquals(updatedRoom.getAmenities(), result.getAmenities());
        assertNotSame(updatedRoom.getAmenities(), result.getAmenities());
        verify(repository).save(existingRoom);
    }

    private static Room room(String roomNumber, String roomType) {
        Room room = new Room();
        room.setRoomNumber(roomNumber);
        room.setRoomType(roomType);
        room.setDescription("A room description.");
        room.setPricePerNight(new BigDecimal("15000"));
        room.setCapacity(2);
        room.setAvailable(true);
        return room;
    }
}
