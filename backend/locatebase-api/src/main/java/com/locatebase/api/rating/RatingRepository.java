package com.locatebase.api.rating;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface RatingRepository extends MongoRepository<Rating, String> {

    Optional<Rating> findByGuesthouseIdAndUserId(String guesthouseId, String userId);

    boolean existsByGuesthouseIdAndUserId(String guesthouseId, String userId);

    Page<Rating> findByGuesthouseId(String guesthouseId, Pageable pageable);
}