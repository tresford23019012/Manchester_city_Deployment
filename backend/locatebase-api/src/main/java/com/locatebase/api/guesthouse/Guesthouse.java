package com.locatebase.api.guesthouse;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Document("guesthouses")
public class Guesthouse {

    @Id
    private String id;

    private String name;
    private String description;
    private String city;
    private String address;

    private GeoJsonPoint location;          // longitude first, then latitude
    private double pricePerNight;           // pula

    private List<String> amenities = new ArrayList<>();   // lowercase, e.g. "wifi", "parking"
    private List<Photo> photos = new ArrayList<>();       // maximum 7, managed by admins
    private Contact contact = new Contact();

    private String ownerId;                 // our user id of the owner (never shown publicly)
    private String requestId;               // the owner request this listing came from (never shown publicly)
    private GuesthouseStatus status = GuesthouseStatus.DRAFT;

    private double ratingAverage;           // 0 when there are no ratings
    private int ratingCount;
    private long viewCount;                 // feeds the dashboard charts (never shown publicly)

    private Promotion promotion;            // null when there is none

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();
}