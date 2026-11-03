package com.locatebase.api.ownerrequest;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectRequest(
        @NotBlank(message = "Reason is required")
        @Size(max = 500, message = "Reason must be 500 characters or fewer")
        String reason) {}
