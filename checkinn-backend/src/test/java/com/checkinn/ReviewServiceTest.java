package com.checkinn;

import com.checkinn.dto.ReviewRequest;
import com.checkinn.entity.Booking;
import com.checkinn.entity.Review;
import com.checkinn.entity.Room;
import com.checkinn.entity.User;
import com.checkinn.enums.BookingStatus;
import com.checkinn.exception.BadRequestException;
import com.checkinn.exception.ConflictException;
import com.checkinn.exception.ForbiddenException;
import com.checkinn.exception.ResourceNotFoundException;
import com.checkinn.repository.BookingRepository;
import com.checkinn.repository.ReviewRepository;
import com.checkinn.repository.RoomRepository;
import com.checkinn.repository.UserRepository;
import com.checkinn.service.ReviewService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
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
    private BookingRepository bookingRepository;
    private ReviewService reviewService;
    private User user;
    private Room room;
    private Booking completedBooking;

    @BeforeEach
    void setUp() {
        reviewRepository = mock(ReviewRepository.class);
        roomRepository = mock(RoomRepository.class);
        userRepository = mock(UserRepository.class);
        bookingRepository = mock(BookingRepository.class);
        reviewService = new ReviewService(
                reviewRepository,
                userRepository,
                roomRepository,
                bookingRepository
        );

        user = new User();
        user.setId(3L);
        user.setName("Avery Guest");
        user.setEmail("avery@example.com");

        room = new Room();
        room.setId(7L);
        room.setRoomType("Courtyard King");

        completedBooking = new Booking();
        completedBooking.setId(10L);
        completedBooking.setUser(user);
        completedBooking.setRoom(room);
        completedBooking.setStatus(BookingStatus.CONFIRMED);
        completedBooking.setCheckInDate(LocalDate.now().minusDays(5));
        completedBooking.setCheckOutDate(LocalDate.now().minusDays(2));
    }

    @Test
    void shouldCreateAndMapReviewWithBookingId() {
        ReviewRequest request = requestWithRating(5);
        request.setBookingId(completedBooking.getId());
        request.setComment("A calm and comfortable stay.");

        when(userRepository.findByEmail(user.getEmail()))
                .thenReturn(Optional.of(user));
        when(roomRepository.findById(room.getId()))
                .thenReturn(Optional.of(room));
        when(bookingRepository.findById(completedBooking.getId()))
                .thenReturn(Optional.of(completedBooking));
        when(reviewRepository.existsByBookingId(completedBooking.getId()))
                .thenReturn(false);
        when(reviewRepository.save(any(Review.class)))
                .thenAnswer(invocation -> {
                    Review review = invocation.getArgument(0);
                    review.prePersist();
                    return review;
                });

        var result = reviewService.createReview(request, user.getEmail());

        assertEquals(room.getId(), result.getRoomId());
        assertEquals(completedBooking.getId(), result.getBookingId());
        assertEquals(user.getName(), result.getUserName());
        assertEquals(5, result.getRating());
        assertEquals(request.getComment(), result.getComment());
        verify(reviewRepository).save(any(Review.class));
    }

    @Test
    void shouldCreateAndMapReviewResolvingBookingFromRoom() {
        ReviewRequest request = requestWithRating(5);
        request.setComment("Resolved from past booking.");

        when(userRepository.findByEmail(user.getEmail()))
                .thenReturn(Optional.of(user));
        when(roomRepository.findById(room.getId()))
                .thenReturn(Optional.of(room));
        when(bookingRepository.findByUserId(user.getId()))
                .thenReturn(List.of(completedBooking));
        when(reviewRepository.existsByBookingId(completedBooking.getId()))
                .thenReturn(false);
        when(reviewRepository.save(any(Review.class)))
                .thenAnswer(invocation -> {
                    Review review = invocation.getArgument(0);
                    review.prePersist();
                    return review;
                });

        var result = reviewService.createReview(request, user.getEmail());

        assertEquals(room.getId(), result.getRoomId());
        assertEquals(completedBooking.getId(), result.getBookingId());
        assertEquals(user.getName(), result.getUserName());
        assertEquals(5, result.getRating());
        verify(reviewRepository).save(any(Review.class));
    }

    @Test
    void shouldRejectReviewWhenUserHasNoBookingForRoom() {
        ReviewRequest request = requestWithRating(5);

        when(userRepository.findByEmail(user.getEmail()))
                .thenReturn(Optional.of(user));
        when(roomRepository.findById(room.getId()))
                .thenReturn(Optional.of(room));
        when(bookingRepository.findByUserId(user.getId()))
                .thenReturn(List.of());

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> reviewService.createReview(request, user.getEmail())
        );

        assertEquals("You must have a completed booking for this room to submit a review", exception.getMessage());
        verify(reviewRepository, never()).save(any(Review.class));
    }

    @Test
    void shouldRejectReviewForAnotherUsersBooking() {
        User anotherUser = new User();
        anotherUser.setId(99L);
        anotherUser.setName("Another Guest");

        completedBooking.setUser(anotherUser);

        ReviewRequest request = requestWithRating(5);
        request.setBookingId(completedBooking.getId());

        when(userRepository.findByEmail(user.getEmail()))
                .thenReturn(Optional.of(user));
        when(roomRepository.findById(room.getId()))
                .thenReturn(Optional.of(room));
        when(bookingRepository.findById(completedBooking.getId()))
                .thenReturn(Optional.of(completedBooking));

        ForbiddenException exception = assertThrows(
                ForbiddenException.class,
                () -> reviewService.createReview(request, user.getEmail())
        );

        assertEquals("You cannot review another user's booking", exception.getMessage());
        verify(reviewRepository, never()).save(any(Review.class));
    }

    @Test
    void shouldRejectReviewForBookingOfDifferentRoom() {
        Room otherRoom = new Room();
        otherRoom.setId(999L);
        completedBooking.setRoom(otherRoom);

        ReviewRequest request = requestWithRating(5);
        request.setBookingId(completedBooking.getId());

        when(userRepository.findByEmail(user.getEmail()))
                .thenReturn(Optional.of(user));
        when(roomRepository.findById(room.getId()))
                .thenReturn(Optional.of(room));
        when(bookingRepository.findById(completedBooking.getId()))
                .thenReturn(Optional.of(completedBooking));

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> reviewService.createReview(request, user.getEmail())
        );

        assertEquals("Booking does not belong to this room", exception.getMessage());
        verify(reviewRepository, never()).save(any(Review.class));
    }

    @Test
    void shouldRejectReviewForCancelledBooking() {
        completedBooking.setStatus(BookingStatus.CANCELLED);

        ReviewRequest request = requestWithRating(5);
        request.setBookingId(completedBooking.getId());

        when(userRepository.findByEmail(user.getEmail()))
                .thenReturn(Optional.of(user));
        when(roomRepository.findById(room.getId()))
                .thenReturn(Optional.of(room));
        when(bookingRepository.findById(completedBooking.getId()))
                .thenReturn(Optional.of(completedBooking));

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> reviewService.createReview(request, user.getEmail())
        );

        assertEquals("Cannot review a cancelled booking", exception.getMessage());
        verify(reviewRepository, never()).save(any(Review.class));
    }

    @Test
    void shouldRejectReviewForFutureBooking() {
        completedBooking.setCheckInDate(LocalDate.now().plusDays(5));
        completedBooking.setCheckOutDate(LocalDate.now().plusDays(10));

        ReviewRequest request = requestWithRating(5);
        request.setBookingId(completedBooking.getId());

        when(userRepository.findByEmail(user.getEmail()))
                .thenReturn(Optional.of(user));
        when(roomRepository.findById(room.getId()))
                .thenReturn(Optional.of(room));
        when(bookingRepository.findById(completedBooking.getId()))
                .thenReturn(Optional.of(completedBooking));

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> reviewService.createReview(request, user.getEmail())
        );

        assertEquals("Cannot review a future booking", exception.getMessage());
        verify(reviewRepository, never()).save(any(Review.class));
    }

    @Test
    void shouldRejectReviewForActiveStayNotYetCompleted() {
        completedBooking.setCheckInDate(LocalDate.now().minusDays(1));
        completedBooking.setCheckOutDate(LocalDate.now().plusDays(2));

        ReviewRequest request = requestWithRating(5);
        request.setBookingId(completedBooking.getId());

        when(userRepository.findByEmail(user.getEmail()))
                .thenReturn(Optional.of(user));
        when(roomRepository.findById(room.getId()))
                .thenReturn(Optional.of(room));
        when(bookingRepository.findById(completedBooking.getId()))
                .thenReturn(Optional.of(completedBooking));

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> reviewService.createReview(request, user.getEmail())
        );

        assertEquals("Cannot review a stay before it is completed", exception.getMessage());
        verify(reviewRepository, never()).save(any(Review.class));
    }

    @Test
    void shouldRejectDuplicateReviewForSameBooking() {
        ReviewRequest request = requestWithRating(4);
        request.setBookingId(completedBooking.getId());

        when(userRepository.findByEmail(user.getEmail()))
                .thenReturn(Optional.of(user));
        when(roomRepository.findById(room.getId()))
                .thenReturn(Optional.of(room));
        when(bookingRepository.findById(completedBooking.getId()))
                .thenReturn(Optional.of(completedBooking));
        when(reviewRepository.existsByBookingId(completedBooking.getId()))
                .thenReturn(true);

        ConflictException exception = assertThrows(
                ConflictException.class,
                () -> reviewService.createReview(request, user.getEmail())
        );

        assertEquals("You have already reviewed this booking", exception.getMessage());
        verify(reviewRepository, never()).save(any(Review.class));
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
    void shouldRejectCommentExceedingMaxLength() {
        ReviewRequest request = requestWithRating(4);
        request.setComment("a".repeat(1001));

        when(userRepository.findByEmail(user.getEmail()))
                .thenReturn(Optional.of(user));
        when(roomRepository.findById(room.getId()))
                .thenReturn(Optional.of(room));

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> reviewService.createReview(request, user.getEmail())
        );

        assertEquals("Comment must not exceed 1000 characters", exception.getMessage());
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
    void shouldReportMissingBooking() {
        ReviewRequest request = requestWithRating(4);
        request.setBookingId(999L);

        when(userRepository.findByEmail(user.getEmail()))
                .thenReturn(Optional.of(user));
        when(roomRepository.findById(room.getId()))
                .thenReturn(Optional.of(room));
        when(bookingRepository.findById(999L))
                .thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> reviewService.createReview(request, user.getEmail())
        );

        assertEquals("Booking not found", exception.getMessage());
    }

    private ReviewRequest requestWithRating(int rating) {
        ReviewRequest request = new ReviewRequest();
        request.setRoomId(room.getId());
        request.setRating(rating);
        return request;
    }
}
