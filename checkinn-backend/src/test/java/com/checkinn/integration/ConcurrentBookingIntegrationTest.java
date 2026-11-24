
package com.checkinn.integration;

import com.checkinn.dto.BookingRequest;
import com.checkinn.entity.Room;
import com.checkinn.entity.User;
import com.checkinn.enums.BookingStatus;
import com.checkinn.enums.Role;
import com.checkinn.exception.ConflictException;
import com.checkinn.repository.BookingRepository;
import com.checkinn.repository.RoomRepository;
import com.checkinn.repository.UserRepository;
import com.checkinn.service.BookingService;
import com.checkinn.service.EmailService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:concurrent_booking_test_db;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.flyway.enabled=true",
        "spring.flyway.baseline-on-migrate=true",
        "spring.flyway.baseline-version=0",
        "spring.jpa.hibernate.ddl-auto=validate",
        "jwt.secret=integration-test-secret-key-1234567890",
        "spring.mail.host=localhost",
        "spring.mail.port=2525",
        "checkinn.inventory.seed-enabled=false"
})
class ConcurrentBookingIntegrationTest {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    // Prevent sending real emails during testing.
    @MockitoBean
    private EmailService emailService;

    @Test
    void onlyOneConcurrentBookingShouldSucceed()
            throws Exception {

        // Create two separate test users.
        User userA = new User();
        userA.setName("User A");
        userA.setEmail("usera@example.com");
        userA.setPassword("test-password");
        userA.setRole(Role.USER);
        userRepository.save(userA);

        User userB = new User();
        userB.setName("User B");
        userB.setEmail("userb@example.com");
        userB.setPassword("test-password");
        userB.setRole(Role.USER);
        userRepository.save(userB);

        // Create one room.
        Room room = new Room();
        room.setRoomNumber("101");
        room.setRoomType("Deluxe");
        room.setDescription("Integration test room");
        room.setPricePerNight(new BigDecimal("15000"));
        room.setCapacity(2);
        room.setAvailable(true);

        room = roomRepository.save(room);

        Long roomId = room.getId();

        LocalDate checkIn = LocalDate.now().plusDays(10);
        LocalDate checkOut = checkIn.plusDays(3);

        // Start two requests at approximately the same time.
        ExecutorService executor =
                Executors.newFixedThreadPool(2);

        CountDownLatch start = new CountDownLatch(1);

        Callable<String> bookAsUserA = () -> {
            start.await();

            return attemptBooking(
                    roomId,
                    checkIn,
                    checkOut,
                    "usera@example.com"
            );
        };

        Callable<String> bookAsUserB = () -> {
            start.await();

            return attemptBooking(
                    roomId,
                    checkIn,
                    checkOut,
                    "userb@example.com"
            );
        };

        try {
            Future<String> resultA =
                    executor.submit(bookAsUserA);

            Future<String> resultB =
                    executor.submit(bookAsUserB);

            start.countDown();

            String outcomeA =
                    resultA.get(30, TimeUnit.SECONDS);

            String outcomeB =
                    resultB.get(30, TimeUnit.SECONDS);

            int successes =
                    ("SUCCESS".equals(outcomeA) ? 1 : 0)
                            + ("SUCCESS".equals(outcomeB) ? 1 : 0);

            int conflicts =
                    ("CONFLICT".equals(outcomeA) ? 1 : 0)
                            + ("CONFLICT".equals(outcomeB) ? 1 : 0);

            assertEquals(1, successes);
            assertEquals(1, conflicts);

            // Verify the actual PostgreSQL data.
            assertEquals(
                    1,
                    bookingRepository
                            .findOverlappingBookings(
                                    roomId,
                                    checkIn,
                                    checkOut,
                                    BookingStatus.CANCELLED
                            )
                            .size()
            );

        } finally {
            executor.shutdownNow();
        }
    }

    private String attemptBooking(
            Long roomId,
            LocalDate checkIn,
            LocalDate checkOut,
            String email
    ) {
        BookingRequest request = new BookingRequest();

        request.setRoomId(roomId);
        request.setCheckInDate(checkIn);
        request.setCheckOutDate(checkOut);
        request.setNumberOfGuests(2);

        try {
            bookingService.createBooking(request, email);
            return "SUCCESS";

        } catch (ConflictException exception) {
            return "CONFLICT";
        }
    }
}
