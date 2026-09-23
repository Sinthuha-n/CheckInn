package com.checkinn.repository;

import com.checkinn.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {

    // Find rooms available for selected dates
    @Query("""
        SELECT r FROM Room r
        WHERE r.available = true
        AND r.id NOT IN (
            SELECT b.room.id
            FROM Booking b
            WHERE b.status <> 'CANCELLED'
            AND b.checkInDate < :checkOut
            AND b.checkOutDate > :checkIn
        )
        """)
    List<Room> findAvailableRooms(
            @Param("checkIn") LocalDate checkIn,
            @Param("checkOut") LocalDate checkOut
    );

    // Search/filter rooms
    @Query("""
        SELECT r FROM Room r
        WHERE (:roomType IS NULL OR r.roomType = :roomType)
        AND (:capacity IS NULL OR r.capacity >= :capacity)
        AND (:maxPrice IS NULL OR r.pricePerNight <= :maxPrice)
        AND r.available = true
        """)
    List<Room> searchRooms(
            @Param("roomType") String roomType,
            @Param("capacity") Integer capacity,
            @Param("maxPrice") BigDecimal maxPrice
    );
}