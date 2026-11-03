package com.locatebase.api.guesthouse;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

// Body of POST /admin/guesthouses/bulk-status: { "ids": [...], "status": "suspended" }
public record BulkStatusRequest(
        @NotEmpty(message = "ids is required")
        @Size(max = 100, message = "At most 100 ids at a time")
        List<@NotBlank(message = "Ids cannot be blank") String> ids,

        @NotBlank(message = "Status is required")
        String status) {}