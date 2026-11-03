package com.locatebase.api.dashboard;

import com.locatebase.api.dashboard.DashboardResponses.Charts;
import com.locatebase.api.dashboard.DashboardResponses.CityCount;
import com.locatebase.api.dashboard.DashboardResponses.GuesthouseFavourites;
import com.locatebase.api.dashboard.DashboardResponses.GuesthouseViews;
import com.locatebase.api.dashboard.DashboardResponses.Snapshot;
import com.locatebase.api.dashboard.DashboardResponses.Stats;
import com.locatebase.api.dashboard.DashboardResponses.StatusCounts;
import com.locatebase.api.dashboard.DashboardResponses.TopRated;
import com.locatebase.api.guesthouse.Guesthouse;
import com.locatebase.api.guesthouse.GuesthouseRepository;
import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private static final long CACHE_MS = 30_000;

    private final MongoTemplate mongo;
    private final GuesthouseRepository guesthouses;

    private record Cached(Snapshot value, long at) {}
    private volatile Cached cache;

    public DashboardService(MongoTemplate mongo, GuesthouseRepository guesthouses) {
        this.mongo = mongo;
        this.guesthouses = guesthouses;
    }

    public Stats stats() {
        return snapshot().stats();
    }

    public Charts charts() {
        return snapshot().charts();
    }

    // Both are worked out together and kept for 30 seconds
    public Snapshot snapshot() {
        Cached c = cache;
        long now = System.currentTimeMillis();
        if (c != null && now - c.at() < CACHE_MS) {
            return c.value();
        }
        Snapshot fresh = new Snapshot(computeStats(), computeCharts());
        cache = new Cached(fresh, now);
        return fresh;
    }

    private Stats computeStats() {
        long total = mongo.count(new Query(), Guesthouse.class);

        // the city with the most guesthouses
        List<Document> cities = mongo.aggregate(Aggregation.newAggregation(
                Aggregation.group("city").count().as("count"),
                Aggregation.sort(Sort.Direction.DESC, "count"),
                Aggregation.limit(1)), "guesthouses", Document.class).getMappedResults();
        CityCount city = cities.isEmpty() ? null
                : new CityCount(cities.get(0).getString("_id"), ((Number) cities.get(0).get("count")).longValue());

        // the best rated published guesthouse that has at least one rating
        Query best = new Query(Criteria.where("status").is("PUBLISHED").and("ratingCount").gt(0))
                .with(Sort.by(Sort.Order.desc("ratingAverage"), Sort.Order.desc("ratingCount")));
        Guesthouse top = mongo.findOne(best, Guesthouse.class);
        TopRated highest = top == null ? null : new TopRated(top.getId(), top.getName(), top.getRatingAverage());

        return new Stats(total, city, highest);
    }

    private Charts computeCharts() {
        // total views, and the five most viewed
        List<Document> sum = mongo.aggregate(Aggregation.newAggregation(
                Aggregation.group().sum("viewCount").as("total")), "guesthouses", Document.class).getMappedResults();
        long totalViews = sum.isEmpty() || sum.get(0).get("total") == null ? 0 : ((Number) sum.get(0).get("total")).longValue();

        Query viewed = new Query(Criteria.where("viewCount").gt(0)).with(Sort.by(Sort.Direction.DESC, "viewCount")).limit(5);
        List<GuesthouseViews> mostViewed = mongo.find(viewed, Guesthouse.class).stream()
                .map(g -> new GuesthouseViews(g.getId(), g.getName(), g.getViewCount()))
                .toList();

        // total favourites, and the five most saved
        long totalFavourites = mongo.count(new Query(), "favourites");
        List<Document> saved = mongo.aggregate(Aggregation.newAggregation(
                Aggregation.group("guesthouseId").count().as("count"),
                Aggregation.sort(Sort.Direction.DESC, "count"),
                Aggregation.limit(5)), "favourites", Document.class).getMappedResults();

        List<String> ids = new ArrayList<>();
        for (Document d : saved) {
            ids.add(d.getString("_id"));
        }
        Map<String, String> names = new HashMap<>();
        for (Guesthouse g : guesthouses.findAllById(ids)) {
            names.put(g.getId(), g.getName());
        }
        List<GuesthouseFavourites> mostFavourited = new ArrayList<>();
        for (Document d : saved) {
            String id = d.getString("_id");
            mostFavourited.add(new GuesthouseFavourites(id, names.getOrDefault(id, "(deleted)"),
                    ((Number) d.get("count")).longValue()));
        }

        StatusCounts status = new StatusCounts(countStatus("DRAFT"), countStatus("PUBLISHED"), countStatus("SUSPENDED"));
        return new Charts(totalViews, mostViewed, totalFavourites, mostFavourited, status);
    }

    private long countStatus(String status) {
        return mongo.count(Query.query(Criteria.where("status").is(status)), Guesthouse.class);
    }
}
