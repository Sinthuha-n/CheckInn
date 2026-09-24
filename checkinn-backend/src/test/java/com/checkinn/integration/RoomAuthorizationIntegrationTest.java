
package com.checkinn.integration;

import com.checkinn.enums.Role;
import com.checkinn.entity.User;
import com.checkinn.repository.UserRepository;
import com.checkinn.service.JwtService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

    // Temporary PostgreSQL database for testing
    @Container
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:17-alpine");

    // Connect Spring Boot to the temporary database
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
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    @Transactional
    void regularUserCannotCreateRoom() throws Exception {

        // 1. Create a regular user
        User user = new User();
        user.setName("Test User");

        user.setEmail(
                "test-" + UUID.randomUUID() + "@example.com"
        );

        user.setPassword(
                passwordEncoder.encode("Password123!")
        );

        user.setRole(Role.USER);

        userRepository.saveAndFlush(user);

        // 2. Generate a valid JWT for the regular user
        String token =
                jwtService.generateToken(user.getEmail());

        // 3. Prepare a room creation request
        String roomJson = """
                {
                    "roomNumber": "999",
                    "roomType": "Deluxe",
                    "description": "Authorization test room",
                    "pricePerNight": 15000,
                    "capacity": 2,
                    "available": true
                }
                """;

        // 4. Regular user must not be allowed to create rooms
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
}