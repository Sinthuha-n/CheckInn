package com.checkinn.repository;

import com.checkinn.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByRoomId(Long roomId);

    boolean existsByUserIdAndRoomId(Long userId, Long roomId);
}