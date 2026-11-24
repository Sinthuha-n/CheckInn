package com.checkinn;

import com.checkinn.entity.Booking;
import com.checkinn.entity.EmailNotification;
import com.checkinn.entity.Review;
import com.checkinn.entity.Room;
import com.checkinn.entity.User;
import com.checkinn.enums.BookingStatus;
import com.checkinn.enums.EmailStatus;
import com.checkinn.enums.Role;
import com.checkinn.repository.BookingRepository;
import com.checkinn.repository.EmailNotificationRepository;
import com.checkinn.repository.ReviewRepository;
import com.checkinn.repository.RoomRepository;
import com.checkinn.repository.UserRepository;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:flyway_test_db;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.flyway.enabled=true",
        "spring.flyway.baseline-on-migrate=true",
        "spring.flyway.baseline-version=0",
        "spring.jpa.hibernate.ddl-auto=validate",
        "jwt.secret=test-secret-key-for-flyway-migration-verification-at-least-32-chars",
        "checkinn.inventory.seed-enabled=false",
        "spring.mail.host=localhost",
        "spring.mail.port=2525"
})
class FlywaySchemaMigrationTest {

    @Autowired
    private Flyway flyway;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private EmailNotificationRepository emailNotificationRepository;

    @Test
    @DisplayName("Flyway migrations V1 and V2 should execute and be recorded in schema history")
    void flywayMigrationsShouldBeAppliedSuccessfully() {
        MigrationInfo[] appliedMigrations = flyway.info().applied();
        assertNotNull(appliedMigrations);
        assertTrue(appliedMigrations.length >= 2, "Expected at least V1 and V2 migrations to be applied");

        assertEquals("1", appliedMigrations[0].getVersion().getVersion());
        assertEquals("initial schema", appliedMigrations[0].getDescription());

        assertEquals("2", appliedMigrations[1].getVersion().getVersion());
        assertEquals("add performance indexes", appliedMigrations[1].getDescription());
    }

    @Test
    @DisplayName("Hibernate validate succeeds and all entity tables accept CRUD operations on Flyway schema")
    void entityTablesShouldSupportCrudAgainstFlywaySchema() {
        // 1. User
        User user = new User();
        user.setName("Migration Test User");
        user.setEmail("flyway_test@checkinn.test");
        user.setPassword("securePassword123");
        user.setRole(Role.USER);
        User savedUser = userRepository.save(user);
        assertNotNull(savedUser.getId());

        // 2. Room with amenities
        Room room = new Room();
        room.setRoomNumber("888");
        room.setRoomType("Penthouse Suite");
        room.setDescription("A luxurious suite created on Flyway schema.");
        room.setPricePerNight(new BigDecimal("50000.00"));
        room.setCapacity(4);
        room.setAvailable(true);
        room.setBedConfiguration("2 King Beds");
        room.setAmenities(List.of("Private Balcony", "Jacuzzi", "High-speed Wi-Fi"));
        Room savedRoom = roomRepository.save(room);
        assertNotNull(savedRoom.getId());

        // 3. Booking
        Booking booking = new Booking();
        booking.setUser(savedUser);
        booking.setRoom(savedRoom);
        booking.setCheckInDate(LocalDate.now().plusDays(5));
        booking.setCheckOutDate(LocalDate.now().plusDays(8));
        booking.setNumberOfGuests(2);
        booking.setTotalPrice(new BigDecimal("150000.00"));
        booking.setStatus(BookingStatus.CONFIRMED);
        Booking savedBooking = bookingRepository.save(booking);
        assertNotNull(savedBooking.getId());

        // Test overlap query with index
        List<Booking> overlaps = bookingRepository.findOverlappingBookings(
                savedRoom.getId(),
                LocalDate.now().plusDays(4),
                LocalDate.now().plusDays(6),
                BookingStatus.CANCELLED
        );
        assertEquals(1, overlaps.size());

        // 4. Review
        Review review = new Review();
        review.setUser(savedUser);
        review.setRoom(savedRoom);
        review.setBooking(savedBooking);
        review.setRating(5);
        review.setComment("Flawless stay on migrated schema!");
        Review savedReview = reviewRepository.save(review);
        assertNotNull(savedReview.getId());
        assertTrue(reviewRepository.existsByBookingId(savedBooking.getId()));

        // 5. EmailNotification
        EmailNotification notification = new EmailNotification();
        notification.setBookingId(savedBooking.getId());
        notification.setRecipientEmail("flyway_test@checkinn.test");
        notification.setStatus(EmailStatus.PENDING);
        notification.setRetryCount(0);
        EmailNotification savedNotification = emailNotificationRepository.save(notification);
        assertNotNull(savedNotification.getId());
        assertEquals(EmailStatus.PENDING, savedNotification.getStatus());
    }
}
