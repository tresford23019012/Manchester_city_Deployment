package com.locatebase.api.guesthouse;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PromotionRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 80, message = "Title must be 80 characters or fewer")
        String title,

        @NotNull(message = "Discount percent is required")
        @Min(value = 1, message = "Discount must be between 1 and 100")
        @Max(value = 100, message = "Discount must be between 1 and 100")
        Integer discountPercent,

        @NotBlank(message = "validUntil is required")
        String validUntil) {}
