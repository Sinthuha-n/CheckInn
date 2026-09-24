
package com.checkinn.integration;

import com.checkinn.enums.Role;
import com.checkinn.entity.Room;
import com.checkinn.entity.User;
import com.checkinn.repository.RoomRepository;
import com.checkinn.repository.UserRepository;
import com.checkinn.service.JwtService;

import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "jwt.secret=integration-test-secret-key-1234567890",
        "spring.mail.host=localhost",
        "spring.mail.port=2525",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc
@Testcontainers
class RoomAuthorizationIntegrationTest {

    // Temporary PostgreSQL database
    @Container
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:17-alpine");

    // Connect Spring Boot to Testcontainers PostgreSQL
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
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // -------------------------------------------------
    // Helper: Create a test user with a specified role
    // -------------------------------------------------

    private User createTestUser(Role role) {

        User user = new User();

        user.setName("Test " + role);
        user.setEmail(
                "test-" + UUID.randomUUID() + "@example.com"
        );
        user.setPassword(
                passwordEncoder.encode("Password123!")
        );
        user.setRole(role);

        return userRepository.saveAndFlush(user);
    }

    // -------------------------------------------------
    // Helper: Create a test room
    // -------------------------------------------------

    private Room createTestRoom() {

        Room room = new Room();

        room.setRoomNumber(
                "TEST-" + UUID.randomUUID()
        );
        room.setRoomType("Deluxe");
        room.setDescription("Authorization test room");
        room.setPricePerNight(
                new BigDecimal("15000")
        );
        room.setCapacity(2);
        room.setAvailable(true);

        return roomRepository.saveAndFlush(room);
    }

    // -------------------------------------------------
    // Test 1: USER cannot create a room
    // -------------------------------------------------

    @Test
    void regularUserCannotCreateRoom() throws Exception {

        User user = createTestUser(Role.USER);

        String token =
                jwtService.generateToken(user.getEmail());

        String roomJson = """
                {
                    "roomNumber": "USER-101",
                    "roomType": "Deluxe",
                    "description": "Regular user room",
                    "pricePerNight": 15000,
                    "capacity": 2,
                    "available": true
                }
                """;

        mockMvc.perform(
                post("/api/rooms")
                        .header(
                                "Authorization",
                                "Bearer " + token
                        )
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(roomJson)
        ).andExpect(status().isForbidden());
    }

    // -------------------------------------------------
    // Test 2: USER cannot update a room
    // -------------------------------------------------

    @Test
    void regularUserCannotUpdateRoom() throws Exception {

        User user = createTestUser(Role.USER);
        Room room = createTestRoom();

        String token =
                jwtService.generateToken(user.getEmail());

        String updatedRoomJson = """
                {
                    "roomNumber": "UPDATED-101",
                    "roomType": "Suite",
                    "description": "Updated room",
                    "pricePerNight": 20000,
                    "capacity": 3,
                    "available": true
                }
                """;

        mockMvc.perform(
                put("/api/rooms/{id}", room.getId())
                        .header(
                                "Authorization",
                                "Bearer " + token
                        )
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatedRoomJson)
        ).andExpect(status().isForbidden());
    }

    // -------------------------------------------------
    // Test 3: USER cannot delete a room
    // -------------------------------------------------

    @Test
    void regularUserCannotDeleteRoom() throws Exception {

        User user = createTestUser(Role.USER);
        Room room = createTestRoom();

        String token =
                jwtService.generateToken(user.getEmail());

        mockMvc.perform(
                delete("/api/rooms/{id}", room.getId())
                        .header(
                                "Authorization",
                                "Bearer " + token
                        )
        ).andExpect(status().isForbidden());

        // The room must still exist after the rejected request
        assertTrue(
                roomRepository.existsById(room.getId())
        );
    }

    // -------------------------------------------------
    // Test 4: ADMIN can create a room
    // -------------------------------------------------

    @Test
    void adminCanCreateRoom() throws Exception {

        User admin = createTestUser(Role.ADMIN);

        String token =
                jwtService.generateToken(admin.getEmail());

        String roomJson = """
                {
                    "roomNumber": "ADMIN-101",
                    "roomType": "Deluxe",
                    "description": "Created by admin",
                    "pricePerNight": 15000,
                    "capacity": 2,
                    "available": true
                }
                """;

        mockMvc.perform(
                post("/api/rooms")
                        .header(
                                "Authorization",
                                "Bearer " + token
                        )
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(roomJson)
        ).andExpect(status().is2xxSuccessful());
    }
}