package com.locatebase.api.guesthouse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

// The body of POST and PUT /admin/guesthouses. Fields not listed here (id, photos, status, ratings)
// are ignored if the app sends them.
public record GuesthouseRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 120, message = "Name must be 120 characters or fewer")
        String name,

        @Size(max = 3000, message = "Description must be 3000 characters or fewer")
        String description,

        @NotBlank(message = "City is required")
        @Size(max = 80, message = "City must be 80 characters or fewer")
        String city,

        @Size(max = 200, message = "Address must be 200 characters or fewer")
        String address,

        @NotNull(message = "Location is required")
        @Valid
        LocationInput location,

        @NotNull(message = "Price per night is required")
        @Positive(message = "Price per night must be more than 0")
        @DecimalMax(value = "1000000", message = "Price per night is too high")
        Double pricePerNight,

        @Size(max = 30, message = "At most 30 amenities")
        List<@Size(max = 40, message = "Each amenity must be 40 characters or fewer") String> amenities,

        @Valid
        ContactInput contact,

        // optional: the owner's account email; they must already have signed up as an owner
        @Email(message = "Owner email is not valid")
        String ownerEmail,

        // optional, used on create only: the owner request this listing is created from
        @Size(max = 60, message = "Request id is too long")
        String requestId) {

    // GeoJSON: coordinates are [longitude, latitude]
    public record LocationInput(
            @NotNull(message = "Coordinates are required")
            @Size(min = 2, max = 2, message = "Coordinates must be [longitude, latitude]")
            List<@NotNull(message = "Coordinates must be numbers") Double> coordinates) {}

    public record ContactInput(
            @Size(max = 30, message = "Phone must be 30 characters or fewer") String phone,
            @Size(max = 30, message = "WhatsApp must be 30 characters or fewer") String whatsapp,
            @Email(message = "Contact email is not valid")
            @Size(max = 120, message = "Contact email must be 120 characters or fewer") String email) {}
}