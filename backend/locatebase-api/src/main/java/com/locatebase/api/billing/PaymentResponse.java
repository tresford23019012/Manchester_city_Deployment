package com.locatebase.api.billing;

import java.time.Instant;
import java.util.List;

// monthlyFee is one night's base price. status is the latest recorded one ("paid" when nothing is recorded yet).
public record PaymentResponse(String guesthouseId, double monthlyFee, String status, List<Entry> history) {

    public record Entry(String month, String status, double amount, String note, String recordedBy,
                        Instant createdAt) {

        static Entry from(Payment p) {
            return new Entry(p.getMonth(), p.getStatus(), p.getAmount(), p.getNote(), p.getRecordedBy(),
                    p.getCreatedAt());
        }
    }
} 

