package com.locatebase.api.guesthouse;

import com.locatebase.api.common.BadRequestException;
import com.locatebase.api.common.ConflictException;
import com.locatebase.api.common.NotFoundException;
import com.locatebase.api.user.AppUser;
import com.locatebase.api.user.AppUserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
public class PromotionService {

    private static final ZoneId BOTSWANA = ZoneId.of("Africa/Gaborone");

    private final GuesthouseRepository repository;
    private final AppUserRepository users;

    public PromotionService(GuesthouseRepository repository, AppUserRepository users) {
        this.repository = repository;
        this.users = users;
    }

    // A guesthouse has at most one promotion, so this is an empty list or a list of one
    public List<PromotionResponse> list(Jwt jwt, String id) {
        Guesthouse g = requireMine(jwt, id);
        return g.getPromotion() == null ? List.of() : List.of(PromotionResponse.from(g.getPromotion()));
    }

    // Creates the promotion, or replaces the existing one
    public PromotionResponse save(Jwt jwt, String id, PromotionRequest in) {
        Guesthouse g = requireMine(jwt, id);
        if (g.getStatus() == GuesthouseStatus.SUSPENDED) {
            throw new ConflictException("This guesthouse is suspended, so it cannot be edited. Please contact LocateBase.");
        }
        Promotion promotion = new Promotion(in.title().trim(), in.discountPercent(), parseValidUntil(in.validUntil()));
        g.setPromotion(promotion);
        g.setUpdatedAt(Instant.now());
        repository.save(g);
        return PromotionResponse.from(promotion);
    }

    // Safe to repeat: ending a promotion that is already gone is not an error
    public void end(Jwt jwt, String id) {
        Guesthouse g = requireMine(jwt, id);
        if (g.getPromotion() != null) {
            g.setPromotion(null);
            g.setUpdatedAt(Instant.now());
            repository.save(g);
        }
    }

    private Guesthouse requireMine(Jwt jwt, String id) {
        AppUser me = users.findByFirebaseUid(jwt.getSubject())
                .orElseThrow(() -> new NotFoundException("No profile yet. Call POST /auth/sync after signing in."));
        Guesthouse g = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Guesthouse not found: " + id));
        if (g.getOwnerId() == null || !g.getOwnerId().equals(me.getId())) {
            throw new AccessDeniedException("Not your guesthouse");
        }
        return g;
    }

    private Instant parseValidUntil(String value) {
        Instant when;
        try {
            String v = value.trim();
            if (v.length() == 10) {
                // a plain date: valid through the end of that day in Botswana
                when = LocalDate.parse(v).plusDays(1).atStartOfDay(BOTSWANA).toInstant().minusSeconds(1);
            } else {
                when = OffsetDateTime.parse(v).toInstant();
            }
        } catch (DateTimeParseException e) {
            throw new BadRequestException(
                    "validUntil must be a date like 2026-11-30 or a time like 2026-11-30T23:59:59Z");
        }
        if (!when.isAfter(Instant.now())) {
            throw new BadRequestException("validUntil must be in the future");
        }
        return when;
    }
}
