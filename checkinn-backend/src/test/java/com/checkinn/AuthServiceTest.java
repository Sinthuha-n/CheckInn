package com.checkinn;

import com.checkinn.dto.LoginRequest;
import com.checkinn.dto.LoginResponse;
import com.checkinn.dto.RegisterRequest;
import com.checkinn.dto.RegisterResponse;
import com.checkinn.entity.User;
import com.checkinn.enums.Role;
import com.checkinn.exception.BadRequestException;
import com.checkinn.exception.ConflictException;
import com.checkinn.repository.UserRepository;
import com.checkinn.service.AuthService;
import com.checkinn.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private JwtService jwtService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        jwtService = mock(JwtService.class);
        authService = new AuthService(userRepository, passwordEncoder, jwtService);
    }

    @Test
    void registerShouldSucceedForNewUser() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Jane Doe");
        request.setEmail("jane@example.com");
        request.setPassword("Password123!");

        when(userRepository.existsByEmail("jane@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password123!")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L);
            return user;
        });

        RegisterResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Jane Doe", response.getName());
        assertEquals("jane@example.com", response.getEmail());
        assertEquals("USER", response.getRole());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void registerShouldThrowConflictExceptionWhenEmailExists() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Jane Doe");
        request.setEmail("jane@example.com");
        request.setPassword("Password123!");

        when(userRepository.existsByEmail("jane@example.com")).thenReturn(true);

        ConflictException ex = assertThrows(
                ConflictException.class,
                () -> authService.register(request)
        );
        assertEquals("Email already registered", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void loginShouldSucceedForValidCredentials() {
        LoginRequest request = new LoginRequest();
        request.setEmail("jane@example.com");
        request.setPassword("Password123!");

        User user = new User();
        user.setId(1L);
        user.setName("Jane Doe");
        user.setEmail("jane@example.com");
        user.setPassword("encodedPassword");
        user.setRole(Role.USER);

        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password123!", "encodedPassword")).thenReturn(true);
        when(jwtService.generateToken("jane@example.com")).thenReturn("mock-token-xyz");

        LoginResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("mock-token-xyz", response.getToken());
        assertEquals("USER", response.getRole());
    }

    @Test
    void loginShouldThrowBadRequestExceptionWhenUserNotFound() {
        LoginRequest request = new LoginRequest();
        request.setEmail("unknown@example.com");
        request.setPassword("Password123!");

        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> authService.login(request)
        );
        assertEquals("Invalid email or password", ex.getMessage());
    }

    @Test
    void loginShouldThrowBadRequestExceptionWhenPasswordDoesNotMatch() {
        LoginRequest request = new LoginRequest();
        request.setEmail("jane@example.com");
        request.setPassword("WrongPassword");

        User user = new User();
        user.setEmail("jane@example.com");
        user.setPassword("encodedPassword");

        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPassword", "encodedPassword")).thenReturn(false);

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> authService.login(request)
        );
        assertEquals("Invalid email or password", ex.getMessage());
    }
}
