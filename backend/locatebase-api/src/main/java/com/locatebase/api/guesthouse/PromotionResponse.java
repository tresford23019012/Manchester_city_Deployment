package com.locatebase.api.guesthouse;

import java.time.Instant;

// active = false once validUntil has passed
public record PromotionResponse(String title, int discountPercent, Instant validUntil, boolean active) {

    public static PromotionResponse from(Promotion p) {
        return new PromotionResponse(p.getTitle(), p.getDiscountPercent(), p.getValidUntil(),
                p.isRunning(Instant.now()));
    }
}
