package com.locatebase.api.rating;

import java.time.Instant;

// One rating as the apps see it
public record RatingResponse(String id, int rating, String comment, String userName,
                             Instant createdAt, Instant updatedAt) {

    public static RatingResponse from(Rating r) {
        return new RatingResponse(r.getId(), r.getRating(), r.getComment(), r.getUserName(),
                r.getCreatedAt(), r.getUpdatedAt());
    }
}