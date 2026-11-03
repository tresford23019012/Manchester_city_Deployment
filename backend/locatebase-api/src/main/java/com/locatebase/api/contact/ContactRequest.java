package com.locatebase.api.contact;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContactRequest(
        @NotBlank(message = "Subject is required")
        @Size(max = 150, message = "Subject must be 150 characters or fewer")
        String subject,

        @NotBlank(message = "Message is required")
        @Size(max = 2000, message = "Message must be 2000 characters or fewer")
        String message) {}