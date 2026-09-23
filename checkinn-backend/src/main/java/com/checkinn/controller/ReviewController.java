package com.checkinn.controller;

import com.checkinn.dto.ReviewRequest;
import com.checkinn.dto.ReviewResponse;
import com.checkinn.service.ReviewService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "http://localhost:5173")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    public ReviewResponse createReview(
            @RequestBody ReviewRequest request,
            Authentication authentication
    ) {

        return reviewService.createReview(
                request,
                authentication.getName()
        );
    }

    @GetMapping("/room/{roomId}")
    public List<ReviewResponse> getReviewsByRoom(
            @PathVariable Long roomId
    ) {
        return reviewService.getReviewsByRoom(roomId);
    }
}
