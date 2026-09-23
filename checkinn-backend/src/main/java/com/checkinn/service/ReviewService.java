package com.checkinn.service;

import com.checkinn.dto.ReviewRequest;
import com.checkinn.dto.ReviewResponse;
import com.checkinn.entity.Review;
import com.checkinn.entity.Room;
import com.checkinn.entity.User;
import com.checkinn.repository.ReviewRepository;
import com.checkinn.repository.RoomRepository;
import com.checkinn.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;

    public ReviewService(
            ReviewRepository reviewRepository,
            UserRepository userRepository,
            RoomRepository roomRepository
    ) {
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
    }

    public ReviewResponse createReview(
            ReviewRequest request,
            String userEmail
    ) {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() ->
                        new RuntimeException("Room not found")
                );

        if (request.getRating() == null ||
                request.getRating() < 1 ||
                request.getRating() > 5) {

            throw new RuntimeException(
                    "Rating must be between 1 and 5"
            );
        }

        if (reviewRepository.existsByUserIdAndRoomId(
                user.getId(),
                room.getId()
        )) {
            throw new RuntimeException(
                    "You have already reviewed this room"
            );
        }

        Review review = new Review();

        review.setUser(user);
        review.setRoom(room);
        review.setRating(request.getRating());
        review.setComment(request.getComment());

        Review savedReview =
                reviewRepository.save(review);

        return convertToResponse(savedReview);
    }

    public List<ReviewResponse> getReviewsByRoom(Long roomId) {

        return reviewRepository.findByRoomId(roomId)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    private ReviewResponse convertToResponse(Review review) {

        return new ReviewResponse(
                review.getId(),
                review.getRoom().getId(),
                review.getUser().getName(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }
}
