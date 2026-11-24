package com.checkinn.config;

import com.checkinn.entity.Room;
import com.checkinn.repository.RoomRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.ApplicationArguments;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RoomInventorySeederTest {

    @Test
    void canonicalInventoryHasExpectedRoomsAndDistribution() {
        List<Room> inventory = RoomInventorySeeder.inventoryRooms();

        assertEquals(30, inventory.size());
        assertEquals(30, inventory.stream()
                .map(Room::getRoomNumber)
                .collect(Collectors.toSet())
                .size());
        assertEquals(expectedRoomNumbers(), inventory.stream()
                .map(Room::getRoomNumber)
                .collect(Collectors.toSet()));
        assertTrue(inventory.stream().allMatch(room ->
                room.getPricePerNight().signum() > 0
                        && room.getCapacity() > 0
                        && Boolean.TRUE.equals(room.getAvailable())
                        && room.getBedConfiguration() != null
                        && !room.getBedConfiguration().isBlank()
                        && !room.getAmenities().isEmpty()
                        && room.getAmenities().stream().allMatch(
                                amenity -> amenity != null
                                        && !amenity.isBlank()
                        )
        ));
        assertEquals(8, inventory.stream()
                .mapToInt(Room::getCapacity)
                .max()
                .orElseThrow());
        assertEquals(expectedTypeDistribution(), inventory.stream()
                .collect(Collectors.groupingBy(
                        Room::getRoomType,
                        Collectors.counting()
                )));
    }

    @Test
    void emptyDatabaseReceivesAllCanonicalRooms() throws Exception {
        RoomRepository repository = mock(RoomRepository.class);
        when(repository.findAllByRoomNumberIn(anyCollection()))
                .thenReturn(List.of());
        RoomInventorySeeder seeder = new RoomInventorySeeder(repository);

        seeder.run(mock(ApplicationArguments.class));

        ArgumentCaptor<List<Room>> roomsCaptor = listCaptor();
        verify(repository).saveAll(roomsCaptor.capture());
        assertEquals(30, roomsCaptor.getValue().size());
        verify(repository).findAllByRoomNumberIn(anyCollection());
    }

    @Test
    void existingCanonicalRoomsAreSkippedWithoutBeingOverwritten()
            throws Exception {
        RoomRepository repository = mock(RoomRepository.class);
        Room existingRoom = new Room();
        existingRoom.setRoomNumber("101");
        existingRoom.setDescription("Administrator-managed description");
        when(repository.findAllByRoomNumberIn(anyCollection()))
                .thenReturn(List.of(existingRoom));
        RoomInventorySeeder seeder = new RoomInventorySeeder(repository);

        seeder.run(mock(ApplicationArguments.class));

        ArgumentCaptor<List<Room>> roomsCaptor = listCaptor();
        verify(repository).saveAll(roomsCaptor.capture());
        assertEquals(29, roomsCaptor.getValue().size());
        assertTrue(roomsCaptor.getValue().stream()
                .noneMatch(room -> "101".equals(
                        room.getRoomNumber()
                )));
        assertEquals(
                "Administrator-managed description",
                existingRoom.getDescription()
        );
    }

    @Test
    void secondRunDoesNotSaveDuplicateRooms() throws Exception {
        RoomRepository repository = mock(RoomRepository.class);
        when(repository.findAllByRoomNumberIn(anyCollection()))
                .thenReturn(List.of())
                .thenReturn(RoomInventorySeeder.inventoryRooms());
        RoomInventorySeeder seeder = new RoomInventorySeeder(repository);

        seeder.run(mock(ApplicationArguments.class));
        seeder.run(mock(ApplicationArguments.class));

        verify(repository, times(2))
                .findAllByRoomNumberIn(anyCollection());
        verify(repository, times(1)).saveAll(
                org.mockito.ArgumentMatchers.<Room>anyList()
        );
    }

    @Test
    void completeInventoryDoesNotTriggerAnEmptySave() throws Exception {
        RoomRepository repository = mock(RoomRepository.class);
        when(repository.findAllByRoomNumberIn(anyCollection()))
                .thenReturn(RoomInventorySeeder.inventoryRooms());
        RoomInventorySeeder seeder = new RoomInventorySeeder(repository);

        seeder.run(mock(ApplicationArguments.class));

        verify(repository, never()).saveAll(
                org.mockito.ArgumentMatchers.<Room>anyList()
        );
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private static ArgumentCaptor<List<Room>> listCaptor() {
        return (ArgumentCaptor) ArgumentCaptor.forClass(List.class);
    }

    private static Set<String> expectedRoomNumbers() {
        Set<String> roomNumbers = new HashSet<>();
        for (int floor = 1; floor <= 3; floor++) {
            for (int room = 1; room <= 10; room++) {
                roomNumbers.add(String.valueOf(floor * 100 + room));
            }
        }
        return roomNumbers;
    }

    private static Map<String, Long> expectedTypeDistribution() {
        return Map.ofEntries(
                Map.entry("Single Room", 4L),
                Map.entry("Standard Double Room", 5L),
                Map.entry("Deluxe Double Room", 4L),
                Map.entry("Twin Room", 3L),
                Map.entry("Superior King Room", 3L),
                Map.entry("Triple Room", 2L),
                Map.entry("Family Room", 3L),
                Map.entry("Deluxe Family Room", 2L),
                Map.entry("Family Suite", 2L),
                Map.entry("Executive Suite", 1L),
                Map.entry("Large Group Suite", 1L)
        );
    }
}
