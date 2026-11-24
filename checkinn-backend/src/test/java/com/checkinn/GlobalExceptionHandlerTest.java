package com.checkinn;

import com.checkinn.exception.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    void dummyMethod(String param) {}

    @Test
    void handleNotFoundReturns404WithStandardMessage() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Resource missing");
        ResponseEntity<Map<String, String>> response = exceptionHandler.handleNotFound(ex);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Resource missing", response.getBody().get("message"));
    }

    @Test
    void handleBadRequestReturns400WithStandardMessage() {
        BadRequestException ex = new BadRequestException("Invalid input");
        ResponseEntity<Map<String, String>> response = exceptionHandler.handleBadRequest(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Invalid input", response.getBody().get("message"));
    }

    @Test
    void handleConflictReturns409WithStandardMessage() {
        ConflictException ex = new ConflictException("Data conflict");
        ResponseEntity<Map<String, String>> response = exceptionHandler.handleConflict(ex);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Data conflict", response.getBody().get("message"));
    }

    @Test
    void handleForbiddenReturns403WithStandardMessage() {
        ForbiddenException ex = new ForbiddenException("Access denied");
        ResponseEntity<Map<String, String>> response = exceptionHandler.handleForbidden(ex);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Access denied", response.getBody().get("message"));
    }

    @Test
    void handleIllegalArgumentReturns400WithStandardMessage() {
        IllegalArgumentException ex = new IllegalArgumentException("Illegal argument value");
        ResponseEntity<Map<String, String>> response = exceptionHandler.handleIllegalArgument(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Illegal argument value", response.getBody().get("message"));
    }

    @Test
    void handleGeneralExceptionReturns500WithStandardMessage() {
        Exception ex = new RuntimeException("Unexpected internal failure");
        ResponseEntity<Map<String, String>> response = exceptionHandler.handleGeneralException(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Unexpected internal failure", response.getBody().get("message"));
    }

    @Test
    void handleGeneralExceptionWithNullMessageReturnsFallback() {
        Exception ex = new RuntimeException();
        ResponseEntity<Map<String, String>> response = exceptionHandler.handleGeneralException(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("An unexpected error occurred", response.getBody().get("message"));
    }

    @Test
    void handleValidationErrorsReturns400WithFieldErrors() throws Exception {
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "target");
        bindingResult.addError(new FieldError("target", "roomNumber", "Room number is required"));
        bindingResult.addError(new FieldError("target", "capacity", "Capacity must be at least 1"));

        MethodParameter parameter = new MethodParameter(
                GlobalExceptionHandlerTest.class.getDeclaredMethod("dummyMethod", String.class), 0
        );
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(parameter, bindingResult);

        ResponseEntity<Map<String, String>> response = exceptionHandler.handleValidationErrors(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Room number is required", response.getBody().get("roomNumber"));
        assertEquals("Capacity must be at least 1", response.getBody().get("capacity"));
    }
}
