package com.checkinn.service;

import com.checkinn.dto.ReviewRequest;
import com.checkinn.dto.ReviewResponse;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;

    public ReviewService(
            ReviewRepository reviewRepository,
            UserRepository userRepository,
            RoomRepository roomRepository,
            BookingRepository bookingRepository
    ) {
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.bookingRepository = bookingRepository;
    }

    @Transactional
    public ReviewResponse createReview(
            ReviewRequest request,
            String userEmail
    ) {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found")
                );

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Room not found")
                );

        if (request.getRating() == null ||
                request.getRating() < 1 ||
                request.getRating() > 5) {

            throw new BadRequestException(
                    "Rating must be between 1 and 5"
            );
        }

        if (request.getComment() != null && request.getComment().length() > 1000) {
            throw new BadRequestException(
                    "Comment must not exceed 1000 characters"
            );
        }

        Booking booking;
        if (request.getBookingId() != null) {
            booking = bookingRepository.findById(request.getBookingId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Booking not found")
                    );

            if (!booking.getUser().getId().equals(user.getId())) {
                throw new ForbiddenException(
                        "You cannot review another user's booking"
                );
            }

            if (!booking.getRoom().getId().equals(room.getId())) {
                throw new BadRequestException(
                        "Booking does not belong to this room"
                );
            }

            if (booking.getStatus() == BookingStatus.CANCELLED) {
                throw new BadRequestException(
                        "Cannot review a cancelled booking"
                );
            }

            LocalDate today = LocalDate.now();
            if (booking.getCheckInDate() != null && today.isBefore(booking.getCheckInDate())) {
                throw new BadRequestException(
                        "Cannot review a future booking"
                );
            }

            if (!booking.isCompleted()) {
                throw new BadRequestException(
                        "Cannot review a stay before it is completed"
                );
            }

            if (reviewRepository.existsByBookingId(booking.getId())) {
                throw new ConflictException(
                        "You have already reviewed this booking"
                );
            }
        } else {
            List<Booking> userBookings = bookingRepository.findByUserId(user.getId())
                    .stream()
                    .filter(b -> b.getRoom().getId().equals(room.getId()))
                    .toList();

            if (userBookings.isEmpty()) {
                throw new BadRequestException(
                        "You must have a completed booking for this room to submit a review"
                );
            }

            if (userBookings.stream().allMatch(b -> b.getStatus() == BookingStatus.CANCELLED)) {
                throw new BadRequestException(
                        "Cannot review a cancelled booking"
                );
            }

            LocalDate today = LocalDate.now();
            if (userBookings.stream()
                    .filter(b -> b.getStatus() != BookingStatus.CANCELLED)
                    .allMatch(b -> b.getCheckInDate() != null && today.isBefore(b.getCheckInDate()))) {
                throw new BadRequestException(
                        "Cannot review a future booking"
                );
            }

            if (userBookings.stream()
                    .filter(b -> b.getStatus() != BookingStatus.CANCELLED)
                    .noneMatch(Booking::isCompleted)) {
                throw new BadRequestException(
                        "Cannot review a stay before it is completed"
                );
            }

            booking = userBookings.stream()
                    .filter(Booking::isCompleted)
                    .filter(b -> !reviewRepository.existsByBookingId(b.getId()))
                    .findFirst()
                    .orElseThrow(() ->
                            new ConflictException("You have already reviewed this booking")
                    );
        }

        Review review = new Review();
        review.setUser(user);
        review.setRoom(room);
        review.setBooking(booking);
        review.setRating(request.getRating());
        review.setComment(request.getComment());

        Review savedReview = reviewRepository.save(review);

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
                review.getBooking() != null ? review.getBooking().getId() : null,
                review.getUser().getName(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }
}
