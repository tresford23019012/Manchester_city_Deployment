package com.locatebase.api.favourite;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

// One saved guesthouse for one user. A unique index on (userId, guesthouseId) stops duplicates.
@Data
@Document("favourites")
public class Favourite {

    @Id
    private String id;

    private String userId;         // our user id
    private String guesthouseId;

    private Instant createdAt = Instant.now();
}