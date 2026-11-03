package com.locatebase.api.ownerrequest;

import java.time.Instant;
import java.util.List;

// One request with its status history. Owners and admins see the same shape.
public record OwnerRequestResponse(
        String id,
        String ownerId,
        String ownerName,
        String ownerEmail,
        String guesthouseName,
        String city,
        String address,
        String phone,
        double pricePerNight,
        String description,
        String notes,
        OwnerRequestStatus status,
        String rejectReason,
        String repName,
        String visitDate,
        List<StatusChange> history,
        Instant createdAt,
        Instant updatedAt) {

    public static OwnerRequestResponse from(OwnerRequest r) {
        return new OwnerRequestResponse(
                r.getId(), r.getOwnerId(), r.getOwnerName(), r.getOwnerEmail(),
                r.getGuesthouseName(), r.getCity(), r.getAddress(), r.getPhone(), r.getPricePerNight(),
                r.getDescription(), r.getNotes(), r.getStatus(), r.getRejectReason(),
                r.getRepName(), r.getVisitDate(), r.getHistory(), r.getCreatedAt(), r.getUpdatedAt());
    }
}
