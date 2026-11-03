package com.locatebase.api.rating;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Document("ratings")
public class Rating {

    @Id
    private String id;

    private String guesthouseId;   // what was rated
    private String userId;         // who rated it (our user id)
    private String userName;       // copied here so the list can show a name without extra lookups

    private int rating;            // 1 to 5
    private String comment;        // optional

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();
}