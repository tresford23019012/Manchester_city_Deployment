package com.locatebase.api.ownerrequest;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record DispatchRepRequest(
        @NotBlank(message = "Representative name is required")
        @Size(max = 100, message = "Representative name must be 100 characters or fewer")
        String repName,

        @NotNull(message = "Visit date is required")
        @FutureOrPresent(message = "Visit date cannot be in the past")
        LocalDate visitDate) {}
