
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
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.mail.host=localhost",
        "spring.mail.port=2525",
        "jwt.secret=integration-test-secret-key-1234567890"
})
@Testcontainers
class ConcurrentBookingIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:17-alpine");

    @DynamicPropertySource
    static void databaseProperties(
            DynamicPropertyRegistry registry
    ) {
        registry.add(
                "spring.datasource.url",
                postgres::getJdbcUrl
        );

        registry.add(
                "spring.datasource.username",
                postgres::getUsername
        );

        registry.add(
                "spring.datasource.password",
                postgres::getPassword
        );
    }

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
