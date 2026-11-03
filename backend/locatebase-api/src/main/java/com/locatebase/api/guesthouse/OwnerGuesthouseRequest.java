package com.locatebase.api.guesthouse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record OwnerGuesthouseRequest(
        @Size(max = 3000, message = "Description must be 3000 characters or fewer")
        String description,

        @NotNull(message = "Price per night is required")
        @Positive(message = "Price per night must be more than 0")
        @DecimalMax(value = "1000000", message = "Price per night is too high")
        Double pricePerNight,

        @Size(max = 30, message = "At most 30 amenities")
        List<@Size(max = 40, message = "Each amenity must be 40 characters or fewer") String> amenities,

        @Valid
        GuesthouseRequest.ContactInput contact) {}