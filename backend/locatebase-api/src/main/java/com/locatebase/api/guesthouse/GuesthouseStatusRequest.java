package com.locatebase.api.guesthouse;

import jakarta.validation.constraints.NotBlank;

// Body of PATCH /admin/guesthouses/{id}/status: { "status": "published" | "draft" | "suspended" }
public record GuesthouseStatusRequest(@NotBlank(message = "Status is required") String status) {}