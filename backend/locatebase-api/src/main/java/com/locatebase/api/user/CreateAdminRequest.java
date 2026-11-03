package com.locatebase.api.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateAdminRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Email is not valid")
        String email) {}
