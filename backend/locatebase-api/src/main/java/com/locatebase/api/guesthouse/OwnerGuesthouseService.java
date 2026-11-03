package com.locatebase.api.guesthouse;

import com.locatebase.api.common.BadRequestException;
import com.locatebase.api.common.ConflictException;
import com.locatebase.api.common.NotFoundException;
import com.locatebase.api.common.PageResponse;
import com.locatebase.api.user.AppUser;
import com.locatebase.api.user.AppUserRepository;
import org.bson.Document;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class OwnerGuesthouseService {

    private static final int MAX_PAGE_SIZE = 50;

    private final GuesthouseRepository repository;
    private final AppUserRepository users;
    private final MongoTemplate mongo;

    public OwnerGuesthouseService(GuesthouseRepository repository, AppUserRepository users, MongoTemplate mongo) {
        this.repository = repository;
        this.users = users;
        this.mongo = mongo;
    }

    // Every guesthouse that belongs to me, whatever its status, so an owner can see a suspension
    public PageResponse<GuesthouseResponse> listMine(Jwt jwt, int page, int size) {
        if (page < 0) throw new BadRequestException("page must be 0 or greater");
        if (size < 1) throw new BadRequestException("size must be at least 1");
        size = Math.min(size, MAX_PAGE_SIZE);

        AppUser me = currentUser(jwt);
        Query query = Query.query(Criteria.where("ownerId").is(me.getId()));
        long total = mongo.count(query, Guesthouse.class);

        query.with(PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "updatedAt").and(Sort.by(Sort.Direction.ASC, "id"))));
        List<GuesthouseResponse> content = mongo.find(query, Guesthouse.class).stream()
                .map(GuesthouseResponse::from)
                .toList();
        return PageResponse.of(content, page, size, total);
    }

    // Only description, price, amenities and contact change. Anything else in the body is ignored.
    public GuesthouseResponse update(Jwt jwt, String id, OwnerGuesthouseRequest in) {
        AppUser me = currentUser(jwt);
        Guesthouse g = requireMine(me, id);
        if (g.getStatus() == GuesthouseStatus.SUSPENDED) {
            throw new ConflictException("This guesthouse is suspended, so it cannot be edited. Please contact LocateBase.");
        }

        double oldPrice = g.getPricePerNight();
        g.setDescription(clean(in.description()));
        g.setPricePerNight(in.pricePerNight());
        g.setAmenities(cleanAmenities(in.amenities()));

        GuesthouseRequest.ContactInput c = in.contact();
        g.setContact(c == null ? new Contact()
                : new Contact(clean(c.phone()), clean(c.whatsapp()), clean(c.email())));
        g.setUpdatedAt(Instant.now());

        Guesthouse saved = repository.save(g);

        // the monthly fee is based on the price, so every owner price change is recorded for admins
        if (oldPrice != saved.getPricePerNight()) {
            mongo.getCollection("price_changes").insertOne(new Document("guesthouseId", saved.getId())
                    .append("oldPrice", oldPrice)
                    .append("newPrice", saved.getPricePerNight())
                    .append("changedBy", me.getId())
                    .append("changedAt", new Date()));
        }
        return GuesthouseResponse.from(saved);
    }

    private AppUser currentUser(Jwt jwt) {
        return users.findByFirebaseUid(jwt.getSubject())
                .orElseThrow(() -> new NotFoundException("No profile yet. Call POST /auth/sync after signing in."));
    }

    // 404 if it does not exist, 403 if it belongs to someone else
    private Guesthouse requireMine(AppUser me, String id) {
        Guesthouse g = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Guesthouse not found: " + id));
        if (g.getOwnerId() == null || !g.getOwnerId().equals(me.getId())) {
            throw new AccessDeniedException("Not your guesthouse");
        }
        return g;
    }

    private String clean(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    private List<String> cleanAmenities(List<String> amenities) {
        Set<String> result = new LinkedHashSet<>();
        if (amenities != null) {
            for (String a : amenities) {
                if (a == null) continue;
                String value = a.trim().toLowerCase().replaceAll("\\s+", "-");
                if (!value.isEmpty()) result.add(value);
            }
        }
        return new ArrayList<>(result);
    }
}
