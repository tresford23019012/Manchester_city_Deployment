package com.locatebase.api.billing;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Document("payments")
public class Payment {

    @Id
    private String id;

    private String guesthouseId;
    private String month;         // e.g. "2026-10"
    private String status;        // "paid" or "overdue"
    private double amount;        // the monthly fee at the time: one night's price
    private String note;
    private String recordedBy;    // the admin's name

    private Instant createdAt = Instant.now();
}
