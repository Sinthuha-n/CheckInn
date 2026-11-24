package com.checkinn;

import com.checkinn.dto.RoomRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class RoomRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    private RoomRequest validRoomRequest() {
        return new RoomRequest(
                "101",
                "Deluxe Single Room",
                "A comfortable deluxe room",
                new BigDecimal("15000"),
                2,
                true,
                "1 Queen Bed",
                List.of("Free Wi-Fi", "Air conditioning")
        );
    }

    @Test
    void shouldPassValidationForValidRoomRequest() {
        RoomRequest request = validRoomRequest();
        Set<ConstraintViolation<RoomRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Valid room request should produce no violations");
    }

    @Test
    void shouldFailWhenRoomNumberIsBlank() {
        RoomRequest request = validRoomRequest();
        request.setRoomNumber("   ");

        Set<ConstraintViolation<RoomRequest>> violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertEquals("roomNumber", violations.iterator().next().getPropertyPath().toString());
    }

    @Test
    void shouldFailWhenRoomNumberIsNull() {
        RoomRequest request = validRoomRequest();
        request.setRoomNumber(null);

        Set<ConstraintViolation<RoomRequest>> violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertEquals("roomNumber", violations.iterator().next().getPropertyPath().toString());
    }

    @Test
    void shouldFailWhenRoomTypeIsBlank() {
        RoomRequest request = validRoomRequest();
        request.setRoomType("");

        Set<ConstraintViolation<RoomRequest>> violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertEquals("roomType", violations.iterator().next().getPropertyPath().toString());
    }

    @Test
    void shouldFailWhenRoomTypeIsNull() {
        RoomRequest request = validRoomRequest();
        request.setRoomType(null);

        Set<ConstraintViolation<RoomRequest>> violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertEquals("roomType", violations.iterator().next().getPropertyPath().toString());
    }

    @Test
    void shouldFailWhenPricePerNightIsNull() {
        RoomRequest request = validRoomRequest();
        request.setPricePerNight(null);

        Set<ConstraintViolation<RoomRequest>> violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertEquals("pricePerNight", violations.iterator().next().getPropertyPath().toString());
    }

    @Test
    void shouldFailWhenPricePerNightIsZeroOrNegative() {
        RoomRequest zeroRequest = validRoomRequest();
        zeroRequest.setPricePerNight(BigDecimal.ZERO);

        Set<ConstraintViolation<RoomRequest>> zeroViolations = validator.validate(zeroRequest);
        assertEquals(1, zeroViolations.size());
        assertEquals("pricePerNight", zeroViolations.iterator().next().getPropertyPath().toString());

        RoomRequest negativeRequest = validRoomRequest();
        negativeRequest.setPricePerNight(new BigDecimal("-100"));

        Set<ConstraintViolation<RoomRequest>> negativeViolations = validator.validate(negativeRequest);
        assertEquals(1, negativeViolations.size());
        assertEquals("pricePerNight", negativeViolations.iterator().next().getPropertyPath().toString());
    }

    @Test
    void shouldFailWhenCapacityIsNull() {
        RoomRequest request = validRoomRequest();
        request.setCapacity(null);

        Set<ConstraintViolation<RoomRequest>> violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertEquals("capacity", violations.iterator().next().getPropertyPath().toString());
    }

    @Test
    void shouldFailWhenCapacityIsLessThanOne() {
        RoomRequest zeroCapacity = validRoomRequest();
        zeroCapacity.setCapacity(0);

        Set<ConstraintViolation<RoomRequest>> zeroViolations = validator.validate(zeroCapacity);
        assertEquals(1, zeroViolations.size());
        assertEquals("capacity", zeroViolations.iterator().next().getPropertyPath().toString());

        RoomRequest negativeCapacity = validRoomRequest();
        negativeCapacity.setCapacity(-1);

        Set<ConstraintViolation<RoomRequest>> negativeViolations = validator.validate(negativeCapacity);
        assertEquals(1, negativeViolations.size());
        assertEquals("capacity", negativeViolations.iterator().next().getPropertyPath().toString());
    }

    @Test
    void shouldFailWhenAvailableIsNull() {
        RoomRequest request = validRoomRequest();
        request.setAvailable(null);

        Set<ConstraintViolation<RoomRequest>> violations = validator.validate(request);
        assertEquals(1, violations.size());
        assertEquals("available", violations.iterator().next().getPropertyPath().toString());
    }
}
