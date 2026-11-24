package com.checkinn;

import com.checkinn.dto.ReviewRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReviewRequestValidationTest {

    private final Validator validator = Validation
            .buildDefaultValidatorFactory()
            .getValidator();

    @Test
    void shouldRequireRoomAndRating() {
        ReviewRequest request = new ReviewRequest();

        var violations = validator.validate(request);

        assertEquals(2, violations.size());
        assertTrue(violations.stream().anyMatch(
                violation -> violation.getPropertyPath().toString().equals("roomId")
        ));
        assertTrue(violations.stream().anyMatch(
                violation -> violation.getPropertyPath().toString().equals("rating")
        ));
    }

    @Test
    void shouldRestrictRatingToOneThroughFive() {
        ReviewRequest request = new ReviewRequest();
        request.setRoomId(7L);
        request.setRating(6);

        var violations = validator.validate(request);

        assertEquals(1, violations.size());
        assertEquals(
                "Rating must be between 1 and 5",
                violations.iterator().next().getMessage()
        );
    }
}
