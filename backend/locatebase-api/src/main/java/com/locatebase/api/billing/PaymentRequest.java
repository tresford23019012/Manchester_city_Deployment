package com.locatebase.api.billing;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PaymentRequest(
        @NotBlank(message = "Status is required")
        String status,

        @Size(max = 500, message = "Note must be 500 characters or fewer")
        String note) {}
