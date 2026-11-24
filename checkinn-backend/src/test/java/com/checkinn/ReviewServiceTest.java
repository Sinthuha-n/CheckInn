package com.checkinn;

import com.checkinn.dto.ReviewRequest;
import com.checkinn.entity.Review;
import com.checkinn.entity.Room;
import com.checkinn.entity.User;
import com.checkinn.exception.BadRequestException;
import com.checkinn.exception.ConflictException;
import com.checkinn.exception.ResourceNotFoundException;
import com.checkinn.repository.ReviewRepository;
import com.checkinn.repository.RoomRepository;
import com.checkinn.repository.UserRepository;
import com.checkinn.service.ReviewService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReviewServiceTest {

    private ReviewRepository reviewRepository;
    private RoomRepository roomRepository;
    private UserRepository userRepository;
    private ReviewService reviewService;
    private User user;
    private Room room;

    @BeforeEach
    void setUp() {
        reviewRepository = mock(ReviewRepository.class);
        roomRepository = mock(RoomRepository.class);
        userRepository = mock(UserRepository.class);
        reviewService = new ReviewService(
                reviewRepository,
                userRepository,
                roomRepository
        );

        user = new User();
        user.setId(3L);
        user.setName("Avery Guest");
        user.setEmail("avery@example.com");

        room = new Room();
        room.setId(7L);
        room.setRoomType("Courtyard King");
    }

    @Test
    void shouldCreateAndMapReview() {
        ReviewRequest request = requestWithRating(5);
        request.setComment("A calm and comfortable stay.");

        when(userRepository.findByEmail(user.getEmail()))
                .thenReturn(Optional.of(user));
        when(roomRepository.findById(room.getId()))
                .thenReturn(Optional.of(room));
        when(reviewRepository.existsByUserIdAndRoomId(user.getId(), room.getId()))
                .thenReturn(false);
        when(reviewRepository.save(any(Review.class)))
                .thenAnswer(invocation -> {
                    Review review = invocation.getArgument(0);
                    review.prePersist();
                    return review;
                });

        var result = reviewService.createReview(request, user.getEmail());

        assertEquals(room.getId(), result.getRoomId());
        assertEquals(user.getName(), result.getUserName());
        assertEquals(5, result.getRating());
        assertEquals(request.getComment(), result.getComment());
        verify(reviewRepository).save(any(Review.class));
    }

    @Test
    void shouldRejectRatingOutsideRange() {
        when(userRepository.findByEmail(user.getEmail()))
                .thenReturn(Optional.of(user));
        when(roomRepository.findById(room.getId()))
                .thenReturn(Optional.of(room));

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> reviewService.createReview(requestWithRating(6), user.getEmail())
        );

        assertEquals("Rating must be between 1 and 5", exception.getMessage());
        verify(reviewRepository, never()).save(any(Review.class));
    }

    @Test
    void shouldReportMissingRoom() {
        when(userRepository.findByEmail(user.getEmail()))
                .thenReturn(Optional.of(user));
        when(roomRepository.findById(room.getId()))
                .thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> reviewService.createReview(requestWithRating(4), user.getEmail())
        );

        assertEquals("Room not found", exception.getMessage());
    }

    @Test
    void shouldRejectDuplicateReview() {
        when(userRepository.findByEmail(user.getEmail()))
                .thenReturn(Optional.of(user));
        when(roomRepository.findById(room.getId()))
                .thenReturn(Optional.of(room));
        when(reviewRepository.existsByUserIdAndRoomId(user.getId(), room.getId()))
                .thenReturn(true);

        ConflictException exception = assertThrows(
                ConflictException.class,
                () -> reviewService.createReview(requestWithRating(4), user.getEmail())
        );

        assertEquals("You have already reviewed this room", exception.getMessage());
        verify(reviewRepository, never()).save(any(Review.class));
    }

    private ReviewRequest requestWithRating(int rating) {
        ReviewRequest request = new ReviewRequest();
        request.setRoomId(room.getId());
        request.setRating(rating);
        return request;
    }
}
