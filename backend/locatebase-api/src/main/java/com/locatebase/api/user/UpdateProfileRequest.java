package com.locatebase.api.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "Name is required") @Size(max = 100, message = "Name must be 100 characters or fewer") String name,
        @Size(max = 500, message = "Photo link must be 500 characters or fewer") String photoUrl) {}