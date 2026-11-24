package com.checkinn.config;

import com.checkinn.entity.Room;
import com.checkinn.repository.RoomRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@ConditionalOnProperty(
        prefix = "checkinn.inventory",
        name = "seed-enabled",
        havingValue = "true"
)
public class RoomInventorySeeder implements ApplicationRunner {

    private final RoomRepository roomRepository;

    public RoomInventorySeeder(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<Room> inventory = inventoryRooms();
        List<String> canonicalRoomNumbers = inventory.stream()
                .map(Room::getRoomNumber)
                .toList();

        Set<String> existingRoomNumbers = new HashSet<>(
                roomRepository.findAllByRoomNumberIn(
                        canonicalRoomNumbers
                ).stream()
                        .map(Room::getRoomNumber)
                        .toList()
        );

        List<Room> missingRooms = inventory.stream()
                .filter(room -> !existingRoomNumbers.contains(
                        room.getRoomNumber()
                ))
                .toList();

        if (!missingRooms.isEmpty()) {
            roomRepository.saveAll(missingRooms);
        }
    }

    static List<Room> inventoryRooms() {
        return List.of(
                room("101", "Single Room", "A quiet room with one single bed, suited to a solo stay.", "12000", 1, "1 Single Bed", amenities("Work desk")),
                room("102", "Single Room", "A bright solo room with one single bed and a compact work area.", "12000", 1, "1 Single Bed", amenities("Work desk", "Tea and coffee station")),
                room("103", "Standard Double Room", "A comfortable room with one queen bed for two guests.", "17000", 2, "1 Queen Bed", amenities("Tea and coffee station")),
                room("104", "Standard Double Room", "A relaxed double room with one queen bed and seating space.", "17500", 2, "1 Queen Bed", amenities("Seating area", "Tea and coffee station")),
                room("105", "Standard Double Room", "A welcoming room with one queen bed for a comfortable city stay.", "18000", 2, "1 Queen Bed", amenities("Mini fridge", "Tea and coffee station")),
                room("106", "Deluxe Double Room", "A spacious double room with one king bed and an expanded lounge area.", "22000", 2, "1 King Bed", amenities("Seating area", "Mini fridge", "Rain shower")),
                room("107", "Deluxe Double Room", "A refined double room with one king bed and generous natural light.", "22500", 2, "1 King Bed", amenities("Seating area", "Mini fridge", "Bathrobes")),
                room("108", "Twin Room", "A practical shared room with two separate twin beds.", "18500", 2, "2 Twin Beds", amenities("Work desk", "Tea and coffee station")),
                room("109", "Superior King Room", "A premium room with one king bed and a spacious seating area.", "26000", 2, "1 King Bed", amenities("Seating area", "Mini fridge", "Bathtub", "Bathrobes")),
                room("110", "Triple Room", "A flexible room with one queen bed and one single bed for three guests.", "25000", 3, "1 Queen Bed + 1 Single Bed", amenities("Seating area", "Mini fridge")),
                room("201", "Single Room", "A peaceful upper-floor room with one single bed and a writing desk.", "12500", 1, "1 Single Bed", amenities("Work desk", "Tea and coffee station")),
                room("202", "Single Room", "A private room with one single bed and extra luggage space.", "13000", 1, "1 Single Bed", amenities("Work desk", "Luggage bench")),
                room("203", "Standard Double Room", "A comfortable room with one queen bed and a compact sitting corner.", "17500", 2, "1 Queen Bed", amenities("Seating area", "Tea and coffee station")),
                room("204", "Standard Double Room", "An upper-floor double room with one queen bed for two guests.", "18500", 2, "1 Queen Bed", amenities("Mini fridge", "Tea and coffee station")),
                room("205", "Deluxe Double Room", "A polished double room with one king bed and a roomy interior.", "23000", 2, "1 King Bed", amenities("Seating area", "Mini fridge", "Rain shower")),
                room("206", "Deluxe Double Room", "A premium double room with one king bed and a quiet upper-floor setting.", "24000", 2, "1 King Bed", amenities("Seating area", "Mini fridge", "Bathrobes")),
                room("207", "Twin Room", "A comfortable twin room with two separate twin beds and shared workspace.", "19000", 2, "2 Twin Beds", amenities("Work desk", "Tea and coffee station")),
                room("208", "Twin Room", "A spacious twin room with two separate twin beds and additional seating.", "20000", 2, "2 Twin Beds", amenities("Seating area", "Mini fridge")),
                room("209", "Superior King Room", "An elegant room with one king bed and an extended lounge area.", "27500", 2, "1 King Bed", amenities("Seating area", "Mini fridge", "Bathtub", "Bathrobes")),
                room("210", "Triple Room", "A spacious room with one queen bed and one single bed for three guests.", "27000", 3, "1 Queen Bed + 1 Single Bed", amenities("Seating area", "Mini fridge", "Tea and coffee station")),
                room("301", "Superior King Room", "A top-floor room with one king bed and a generous seating area.", "29000", 2, "1 King Bed", amenities("Seating area", "Mini fridge", "Bathtub", "Bathrobes")),
                room("302", "Family Room", "A family-friendly room with two queen beds for up to four guests.", "32000", 4, "2 Queen Beds", amenities("Seating area", "Mini fridge", "Dining table")),
                room("303", "Family Room", "A spacious family room with two queen beds and shared seating.", "33500", 4, "2 Queen Beds", amenities("Seating area", "Mini fridge", "Dining table")),
                room("304", "Family Room", "A large family room with two queen beds and extra storage space.", "35000", 4, "2 Queen Beds", amenities("Seating area", "Mini fridge", "Luggage bench")),
                room("305", "Deluxe Family Room", "A flexible family room with two queen beds and one single bed.", "42000", 5, "2 Queen Beds + 1 Single Bed", amenities("Living area", "Mini fridge", "Dining table", "Bathtub")),
                room("306", "Deluxe Family Room", "A generous family room with two queen beds and one single bed for five guests.", "45000", 5, "2 Queen Beds + 1 Single Bed", amenities("Living area", "Mini fridge", "Dining table", "Bathtub")),
                room("307", "Family Suite", "A two-area suite with two queen beds and two single beds for six guests.", "52000", 6, "2 Queen Beds + 2 Single Beds", amenities("Separate living area", "Mini fridge", "Dining table", "Bathtub")),
                room("308", "Family Suite", "A spacious suite with two queen beds and two single beds for a family stay.", "56000", 6, "2 Queen Beds + 2 Single Beds", amenities("Separate living area", "Mini fridge", "Dining table", "Bathtub")),
                room("309", "Executive Suite", "An executive suite with one king bed and a queen sofa bed for up to four guests.", "48000", 4, "1 King Bed + 1 Queen Sofa Bed", amenities("Separate living area", "Mini fridge", "Dining table", "Bathtub", "Bathrobes")),
                room("310", "Large Group Suite", "A large suite with two queen beds and four single beds for up to eight guests.", "68000", 8, "2 Queen Beds + 4 Single Beds", amenities("Separate living area", "Mini fridge", "Dining table", "Two bathrooms"))
        );
    }

    private static Room room(
            String roomNumber,
            String roomType,
            String description,
            String pricePerNight,
            int capacity,
            String bedConfiguration,
            List<String> amenities
    ) {
        Room room = new Room();
        room.setRoomNumber(roomNumber);
        room.setRoomType(roomType);
        room.setDescription(description);
        room.setPricePerNight(new BigDecimal(pricePerNight));
        room.setCapacity(capacity);
        room.setAvailable(true);
        room.setBedConfiguration(bedConfiguration);
        room.setAmenities(amenities);
        return room;
    }

    private static List<String> amenities(String... additionalAmenities) {
        List<String> amenities = new ArrayList<>(List.of(
                "Free Wi-Fi",
                "Air conditioning",
                "Private bathroom",
                "Flat-screen TV"
        ));
        amenities.addAll(List.of(additionalAmenities));
        return List.copyOf(amenities);
    }
}
