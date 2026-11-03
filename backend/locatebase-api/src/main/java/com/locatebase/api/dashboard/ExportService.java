package com.locatebase.api.dashboard;

import com.locatebase.api.guesthouse.Guesthouse;
import com.locatebase.api.user.AppUser;
import com.locatebase.api.user.AppUserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class ExportService {

    private static final int MAX_ROWS = 20_000;
    private static final String BOM = "\uFEFF";   // so Excel reads accents correctly
    private static final String EOL = "\r\n";

    private final MongoTemplate mongo;
    private final AppUserRepository users;

    public ExportService(MongoTemplate mongo, AppUserRepository users) {
        this.mongo = mongo;
        this.users = users;
    }

    public byte[] guesthousesCsv() {
        List<Guesthouse> all = mongo.find(
                new Query().with(Sort.by(Sort.Direction.DESC, "createdAt")).limit(MAX_ROWS), Guesthouse.class);

        Set<String> ownerIds = new HashSet<>();
        for (Guesthouse g : all) {
            if (g.getOwnerId() != null) ownerIds.add(g.getOwnerId());
        }
        Map<String, String> ownerEmails = new HashMap<>();
        for (AppUser u : users.findAllById(ownerIds)) {
            ownerEmails.put(u.getId(), u.getEmail());
        }

        StringBuilder sb = new StringBuilder(BOM);
        sb.append("id,name,city,address,pricePerNight,status,ratingAverage,ratingCount,viewCount,ownerEmail,"
                + "phone,whatsapp,contactEmail,amenities,photoCount,promotion,createdAt").append(EOL);
        for (Guesthouse g : all) {
            var c = g.getContact();
            var promo = g.getPromotion();
            String promoText = (promo != null && promo.isRunning(Instant.now()))
                    ? promo.getTitle() + " (" + promo.getDiscountPercent() + "%)" : "";
            row(sb,
                    g.getId(), g.getName(), g.getCity(), g.getAddress(), g.getPricePerNight(),
                    g.getStatus() == null ? "" : g.getStatus().toJson(),
                    g.getRatingAverage(), g.getRatingCount(), g.getViewCount(),
                    ownerEmails.getOrDefault(g.getOwnerId(), ""),
                    c == null ? "" : c.getPhone(), c == null ? "" : c.getWhatsapp(), c == null ? "" : c.getEmail(),
                    g.getAmenities() == null ? "" : String.join(";", g.getAmenities()),
                    g.getPhotos() == null ? 0 : g.getPhotos().size(),
                    promoText, g.getCreatedAt());
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public byte[] usersCsv() {
        List<AppUser> all = mongo.find(
                new Query().with(Sort.by(Sort.Direction.DESC, "createdAt")).limit(MAX_ROWS), AppUser.class);

        StringBuilder sb = new StringBuilder(BOM);
        sb.append("id,email,name,role,blocked,createdAt").append(EOL);
        for (AppUser u : all) {
            row(sb, u.getId(), u.getEmail(), u.getName(),
                    u.getRole() == null ? "" : u.getRole().toJson(), u.isBlocked(), u.getCreatedAt());
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private void row(StringBuilder sb, Object... cells) {
        for (int i = 0; i < cells.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(cell(cells[i]));
        }
        sb.append(EOL);
    }

    private String cell(Object value) {
        if (value == null) return "";
        String s = String.valueOf(value);
        // a cell starting with = + - or @ would run as a formula when opened in Excel
        if (!s.isEmpty() && "=+-@\t\r".indexOf(s.charAt(0)) >= 0) {
            s = "'" + s;
        }
        if (s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r")) {
            s = "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }
}