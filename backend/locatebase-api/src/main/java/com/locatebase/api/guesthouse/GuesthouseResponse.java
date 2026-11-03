package com.locatebase.api.guesthouse;

import org.springframework.data.mongodb.core.geo.GeoJsonPoint;

import java.time.Instant;
import java.util.List;

//public guesthouse object
public record GuesthouseResponse(
       String id,
        String name,
        String description,
        String city,
        String address,
        Location location,
        double pricePerNight,
        List<String> amenities,
        List<Photo> photos,
        Contact contact,
        GuesthouseStatus status,
        double ratingAverage,
        int ratingCount,
        Promotion promotion,
        Instant createdAt,
        Instant updatedAt) {

  // GeoJSON: { "type": "Point", "coordinates": [longitude, latitude] }
    public record Location(String type, List<Double> coordinates) {}

    public static GuesthouseResponse from(Guesthouse g) {
        GeoJsonPoint p = g.getLocation();
        Location location = p == null ? null : new Location("Point", List.of(p.getX(), p.getY()));   // x = longitude, y = latitude

        // only show a promotion while it is still running
        Promotion promo = g.getPromotion();
        Promotion shown = (promo != null && promo.isRunning(Instant.now())) ? promo : null;

        return new GuesthouseResponse(
                g.getId(), g.getName(), g.getDescription(), g.getCity(), g.getAddress(),
                location, g.getPricePerNight(), g.getAmenities(), g.getPhotos(), g.getContact(),
                g.getStatus(), g.getRatingAverage(), g.getRatingCount(), shown,
                g.getCreatedAt(), g.getUpdatedAt());
    }
}
