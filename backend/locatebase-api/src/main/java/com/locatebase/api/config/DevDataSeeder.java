package com.locatebase.api.config;

import com.locatebase.api.guesthouse.Contact;
import com.locatebase.api.guesthouse.Guesthouse;
import com.locatebase.api.guesthouse.GuesthouseRepository;
import com.locatebase.api.guesthouse.GuesthouseStatus;
import com.locatebase.api.guesthouse.Promotion;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@Profile("dev")   // only runs when the app is started with the dev profile
public class DevDataSeeder implements CommandLineRunner {

    private final GuesthouseRepository repository;
    private int counter = 0;   // used to give each sample a different phone number

    public DevDataSeeder(GuesthouseRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        if (repository.count() > 0) {
            return;   // already seeded, don't add duplicates
        }

        Promotion monthEnd = new Promotion("Month-end special", 15, Instant.now().plus(30, ChronoUnit.DAYS));
        Promotion weekend = new Promotion("Weekend getaway", 10, Instant.now().plus(14, ChronoUnit.DAYS));

        repository.saveAll(List.of(
                make("Kgotla View Guesthouse", "Palapye", "Plot 1021, Main Road", 27.1247, -22.5467, 450, 4.3, 12,
                        GuesthouseStatus.PUBLISHED, List.of("wifi", "parking", "breakfast"), null),
                make("Pula Palms Guesthouse", "Gaborone", "Plot 5543, Phase 2", 25.9231, -24.6282, 780, 4.7, 31,
                        GuesthouseStatus.PUBLISHED, List.of("wifi", "pool", "air-conditioning", "parking"), monthEnd),
                make("Tati River Lodge", "Francistown", "Tati River Road", 27.5100, -21.1700, 620, 4.0, 8,
                        GuesthouseStatus.PUBLISHED, List.of("wifi", "garden", "braai-area"), null),
                make("Thamalakane Retreat", "Maun", "Shorobe Road", 23.4167, -19.9833, 950, 4.8, 44,
                        GuesthouseStatus.PUBLISHED, List.of("wifi", "pool", "breakfast", "parking", "air-conditioning"), weekend),
                make("Chobe Gateway Inn", "Kasane", "Kazungula Road", 25.1500, -17.8000, 1100, 4.6, 27,
                        GuesthouseStatus.PUBLISHED, List.of("wifi", "pool", "restaurant", "parking"), null),
                make("Khama Heritage House", "Serowe", "Kgosing Ward", 26.7167, -22.3833, 380, 3.9, 6,
                        GuesthouseStatus.PUBLISHED, List.of("wifi", "parking"), null),
                make("Lobatse Hills Guesthouse", "Lobatse", "Hill Road", 25.6833, -25.2167, 420, 4.1, 9,
                        GuesthouseStatus.PUBLISHED, List.of("wifi", "kitchen", "garden"), null),
                make("Kanye Sunset Lodge", "Kanye", "Segkoma Road", 25.3333, -24.9667, 350, 3.7, 4,
                        GuesthouseStatus.PUBLISHED, List.of("parking", "tv"), null),
                // these two must never appear in the public list
                make("Draft Example House", "Gaborone", "Plot 100, Broadhurst", 25.9100, -24.6500, 500, 0, 0,
                        GuesthouseStatus.DRAFT, List.of("wifi"), null),
                make("Suspended Example Inn", "Gaborone", "Plot 200, Block 8", 25.9000, -24.6700, 300, 3.0, 2,
                        GuesthouseStatus.SUSPENDED, List.of("wifi"), null)
        ));
    }

    private Guesthouse make(String name, String city, String address, double lng, double lat, double price,
                            double rating, int ratingCount, GuesthouseStatus status,
                            List<String> amenities, Promotion promotion) {
        counter++;
        String phone = String.format("+267710%05d", counter);

        Guesthouse g = new Guesthouse();
        g.setName(name);
        g.setDescription("A comfortable guesthouse in " + city + ". Sample listing for development.");
        g.setCity(city);
        g.setAddress(address);
        g.setLocation(new GeoJsonPoint(lng, lat));   // longitude first, then latitude
        g.setPricePerNight(price);
        g.setAmenities(amenities);
        g.setContact(new Contact(phone, phone, "info" + counter + "@example.co.bw"));
        g.setRatingAverage(rating);
        g.setRatingCount(ratingCount);
        g.setStatus(status);
        g.setPromotion(promotion);
        return g;
    }
}