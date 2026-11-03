package com.locatebase.api.rating;

import com.locatebase.api.common.BadRequestException;
import com.locatebase.api.common.ConflictException;
import com.locatebase.api.common.NotFoundException;
import com.locatebase.api.common.PageResponse;
import com.locatebase.api.guesthouse.Guesthouse;
import com.locatebase.api.guesthouse.GuesthouseRepository;
import com.locatebase.api.guesthouse.GuesthouseStatus;
import com.locatebase.api.user.AppUser;
import com.locatebase.api.user.AppUserRepository;
import org.bson.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class RatingService {

    private static final int MAX_PAGE_SIZE = 50;

    private final RatingRepository ratings;
    private final GuesthouseRepository guesthouses;
    private final AppUserRepository users;
    private final MongoTemplate mongo;

    public RatingService(RatingRepository ratings, GuesthouseRepository guesthouses,
                         AppUserRepository users, MongoTemplate mongo) {
        this.ratings = ratings;
        this.guesthouses = guesthouses;
        this.users = users;
        this.mongo = mongo;
    }

    // ---------- public reads ----------

    public PageResponse<RatingResponse> list(String guesthouseId, int page, int size) {
        requirePublished(guesthouseId);
        if (page < 0) throw new BadRequestException("page must be 0 or greater");
        if (size < 1) throw new BadRequestException("size must be at least 1");
        size = Math.min(size, MAX_PAGE_SIZE);

        Page<Rating> result = ratings.findByGuesthouseId(guesthouseId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));   // newest first
        List<RatingResponse> content = result.getContent().stream().map(RatingResponse::from).toList();
        return PageResponse.of(content, page, size, result.getTotalElements());
    }

    public RatingSummary summary(String guesthouseId) {
        requirePublished(guesthouseId);
        return computeSummary(guesthouseId);
    }

    // ---------- logged-in actions ----------

    public RatingResponse create(String guesthouseId, Jwt jwt, RatingRequest request) {
        requirePublished(guesthouseId);
        AppUser user = currentUser(jwt);

        if (ratings.existsByGuesthouseIdAndUserId(guesthouseId, user.getId())) {
            throw new ConflictException("You have already rated this guesthouse. Edit your rating instead.");
        }

        Rating rating = new Rating();
        rating.setGuesthouseId(guesthouseId);
        rating.setUserId(user.getId());
        rating.setUserName(user.getName());
        rating.setRating(request.rating());
        rating.setComment(cleanComment(request.comment()));
        rating = ratings.save(rating);

        refreshGuesthouse(guesthouseId);
        return RatingResponse.from(rating);
    }

    public RatingResponse updateMine(String guesthouseId, Jwt jwt, RatingRequest request) {
        requirePublished(guesthouseId);
        AppUser user = currentUser(jwt);

        Rating rating = ratings.findByGuesthouseIdAndUserId(guesthouseId, user.getId())
                .orElseThrow(() -> new NotFoundException("You have not rated this guesthouse yet."));
        rating.setRating(request.rating());
        rating.setComment(cleanComment(request.comment()));
        rating.setUserName(user.getName());
        rating.setUpdatedAt(Instant.now());
        rating = ratings.save(rating);

        refreshGuesthouse(guesthouseId);
        return RatingResponse.from(rating);
    }

    public void deleteMine(String guesthouseId, Jwt jwt) {
        requirePublished(guesthouseId);
        AppUser user = currentUser(jwt);

        Rating rating = ratings.findByGuesthouseIdAndUserId(guesthouseId, user.getId())
                .orElseThrow(() -> new NotFoundException("You have not rated this guesthouse yet."));
        ratings.delete(rating);

        refreshGuesthouse(guesthouseId);
    }

    // ---------- helpers ----------

    private Guesthouse requirePublished(String guesthouseId) {
        return guesthouses.findById(guesthouseId)
                .filter(g -> g.getStatus() == GuesthouseStatus.PUBLISHED)
                .orElseThrow(() -> new NotFoundException("Guesthouse not found: " + guesthouseId));
    }

    private AppUser currentUser(Jwt jwt) {
        return users.findByFirebaseUid(jwt.getSubject())
                .orElseThrow(() -> new NotFoundException("No profile yet. Call POST /auth/sync after signing in."));
    }

    private String cleanComment(String comment) {
        return (comment == null || comment.isBlank()) ? null : comment.trim();
    }

    private RatingSummary computeSummary(String guesthouseId) {
        Aggregation agg = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("guesthouseId").is(guesthouseId)),
                Aggregation.group("rating").count().as("count"));
        AggregationResults<Document> results = mongo.aggregate(agg, "ratings", Document.class);

        Map<String, Integer> distribution = new LinkedHashMap<>();
        for (int stars = 1; stars <= 5; stars++) distribution.put(String.valueOf(stars), 0);

        int total = 0;
        int sum = 0;
        for (Document d : results.getMappedResults()) {
            int stars = ((Number) d.get("_id")).intValue();
            int n = ((Number) d.get("count")).intValue();
            distribution.put(String.valueOf(stars), n);
            total += n;
            sum += stars * n;
        }
        double average = total == 0 ? 0 : Math.round((double) sum / total * 10.0) / 10.0;
        return new RatingSummary(average, total, distribution);
    }

    // keeps the average and count stored on the guesthouse correct after any change
    private void refreshGuesthouse(String guesthouseId) {
        RatingSummary s = computeSummary(guesthouseId);
        mongo.updateFirst(
                Query.query(Criteria.where("id").is(guesthouseId)),
                new Update().set("ratingAverage", s.average()).set("ratingCount", s.count()),
                Guesthouse.class);
    }
}