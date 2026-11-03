package com.locatebase.api.ownerrequest;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

// A "List your guesthouse" application from an owner. It is not a listing until staff publish one.
@Data
@Document("owner_requests")
public class OwnerRequest {

    @Id
    private String id;

    private String ownerId;       // our user id of the owner who applied
    private String ownerName;     // copied so admins can see it without extra lookups
    private String ownerEmail;

    private String guesthouseName;
    private String city;
    private String address;
    private String phone;
    private double pricePerNight;
    private String description;
    private String notes;

    private OwnerRequestStatus status = OwnerRequestStatus.PENDING;
    private String rejectReason;

    private String repName;       // the LocateBase representative sent to the guesthouse
    private String visitDate;     // ISO date, e.g 2026-11-03

    private List<StatusChange> history = new ArrayList<>();

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();
}
