package com.locatebase.api.ownerrequest;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

// Body of POST /owner/requests
public record OwnerRequestInput(
        @NotBlank(message = "Guesthouse name is required")
        @Size(max = 120, message = "Guesthouse name must be 120 characters or fewer")
        String guesthouseName,

        @NotBlank(message = "City is required")
        @Size(max = 80, message = "City must be 80 characters or fewer")
        String city,

        @Size(max = 200, message = "Address must be 200 characters or fewer")
        String address,

        @NotBlank(message = "Phone is required")
        @Size(max = 30, message = "Phone must be 30 characters or fewer")
        String phone,

        @NotNull(message = "Price per night is required")
        @Positive(message = "Price per night must be more than 0")
        @DecimalMax(value = "1000000", message = "Price per night is too high")
        Double pricePerNight,

        @Size(max = 3000, message = "Description must be 3000 characters or fewer")
        String description,

        @Size(max = 1000, message = "Notes must be 1000 characters or fewer")
        String notes) {}
