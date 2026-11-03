package com.locatebase.api.ownerrequest;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

// One entry in a request's status history
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatusChange {
    private OwnerRequestStatus status;
    private Instant at;
    private String by;      // who made the change
    private String note;
}
