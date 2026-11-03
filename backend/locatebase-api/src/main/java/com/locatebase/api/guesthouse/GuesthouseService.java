package com.locatebase.api.guesthouse;

import com.locatebase.api.common.BadRequestException;
import com.locatebase.api.common.NotFoundException;
import com.locatebase.api.common.PageResponse;
import com.mongodb.client.MongoCollection;
import org.bson.Document;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class GuesthouseService {

    private static final int MAX_PAGE_SIZE = 50;
    private static final double DEFAULT_RADIUS_KM = 10;
    private static final double MAX_RADIUS_KM = 500;

    private final GuesthouseRepository repository;
    private final MongoTemplate mongo;

    public GuesthouseService(GuesthouseRepository repository, MongoTemplate mongo) {
        this.repository = repository;
        this.mongo = mongo;
    }

    public GuesthouseResponse getPublicById(String id) {
        Guesthouse g = repository.findById(id)
                .filter(x -> x.getStatus() == GuesthouseStatus.PUBLISHED)   // draft and suspended look like "not found"
                .orElseThrow(() -> new NotFoundException("Guesthouse not found: " + id));

        // every successful detail view counts once, for the dashboard charts
        mongo.updateFirst(Query.query(Criteria.where("id").is(id)),
                new Update().inc("viewCount", 1), Guesthouse.class);

        return GuesthouseResponse.from(g);
    }

    public PageResponse<GuesthouseResponse> search(String search, String city, Double minPrice, Double maxPrice,
                                                   Double minRating, String amenities, String sort,
                                                   Double lat, Double lng, int page, int size) {
        checkPaging(page, size);
        size = Math.min(size, MAX_PAGE_SIZE);

        Criteria filter = buildFilter(search, city, minPrice, maxPrice, minRating, amenities);

        // sort=distance: nearest first, measured from the app's own position
        if (sort != null && sort.trim().equalsIgnoreCase("distance")) {
            if (lat == null || lng == null) {
                throw new BadRequestException("sort=distance needs lat and lng");
            }
            checkLocation(lat, lng);
            return geoPage(filter, lat, lng, null, page, size);
        }

        Query query = new Query(filter);
        long total = mongo.count(query, Guesthouse.class);   // count before paging

        query.with(PageRequest.of(page, size, buildSort(sort)));
        List<GuesthouseResponse> content = mongo.find(query, Guesthouse.class).stream()
                .map(GuesthouseResponse::from)
                .toList();

        return PageResponse.of(content, page, size, total);
    }

    // Guesthouses within radiusKm of a point, nearest first
    public PageResponse<GuesthouseResponse> nearby(Double lat, Double lng, Double radiusKm, int page, int size) {
        checkPaging(page, size);
        size = Math.min(size, MAX_PAGE_SIZE);

        if (lat == null || lng == null) {
            throw new BadRequestException("lat and lng are required");
        }
        checkLocation(lat, lng);

        double radius = radiusKm == null ? DEFAULT_RADIUS_KM : radiusKm;
        if (radius <= 0 || radius > MAX_RADIUS_KM) {
            throw new BadRequestException("radiusKm must be more than 0 and at most " + (int) MAX_RADIUS_KM);
        }

        Criteria filter = buildFilter(null, null, null, null, null, null);
        return geoPage(filter, lat, lng, radius * 1000, page, size);   // MongoDB measures in metres
    }

    // The cities and amenities that actually exist, for the filters tab
    public FilterOptions filterOptions() {
        Query published = Query.query(Criteria.where("status").is(GuesthouseStatus.PUBLISHED.name()));

        List<String> cities = new ArrayList<>(mongo.findDistinct(published, "city", Guesthouse.class, String.class));
        List<String> amenities = new ArrayList<>(mongo.findDistinct(published, "amenities", Guesthouse.class, String.class));

        cities.removeIf(c -> c == null || c.isBlank());
        amenities.removeIf(a -> a == null || a.isBlank());
        cities.sort(String.CASE_INSENSITIVE_ORDER);
        amenities.sort(String.CASE_INSENSITIVE_ORDER);

        return new FilterOptions(cities, amenities);
    }

    // ---------- helpers ----------

    // The shared filters. Only PUBLISHED guesthouses are ever public.
    private Criteria buildFilter(String search, String city, Double minPrice, Double maxPrice,
                                 Double minRating, String amenities) {
        List<Criteria> filters = new ArrayList<>();
        filters.add(Criteria.where("status").is(GuesthouseStatus.PUBLISHED.name()));

        // Pattern.quote treats the user's text as plain text, so it can't be abused as a query pattern
        if (search != null && !search.isBlank()) {
            String literal = Pattern.quote(search.trim());
            filters.add(new Criteria().orOperator(
                    Criteria.where("name").regex(literal, "i"),
                    Criteria.where("city").regex(literal, "i"),
                    Criteria.where("address").regex(literal, "i")));
        }
        if (city != null && !city.isBlank()) {
            filters.add(Criteria.where("city").regex("^" + Pattern.quote(city.trim()) + "$", "i"));
        }
        if (minPrice != null || maxPrice != null) {
            Criteria price = Criteria.where("pricePerNight");
            if (minPrice != null) price = price.gte(minPrice);
            if (maxPrice != null) price = price.lte(maxPrice);
            filters.add(price);
        }
        if (minRating != null) {
            filters.add(Criteria.where("ratingAverage").gte(minRating));
        }

        // amenities=wifi,parking means the guesthouse must have ALL of the listed amenities
        List<String> wanted = parseAmenities(amenities);
        if (!wanted.isEmpty()) {
            filters.add(Criteria.where("amenities").all(wanted));
        }
        return new Criteria().andOperator(filters);
    }

    // Runs MongoDB's $geoNear, which sorts by distance using the 2dsphere index
    private PageResponse<GuesthouseResponse> geoPage(Criteria filter, double lat, double lng,
                                                     Double maxDistanceMeters, int page, int size) {
        Document near = new Document("near", new Document("type", "Point").append("coordinates", List.of(lng, lat)))
                .append("distanceField", "distanceMeters")
                .append("spherical", true)
                .append("query", filter.getCriteriaObject());
        if (maxDistanceMeters != null) {
            near.append("maxDistance", maxDistanceMeters);
        }

        MongoCollection<Document> collection = mongo.getCollection("guesthouses");

        // how many match in total (for the paging numbers)
        Document counted = collection.aggregate(List.of(
                new Document("$geoNear", near),
                new Document("$count", "n"))).first();
        long total = counted == null ? 0 : ((Number) counted.get("n")).longValue();

        // the requested page, nearest first
        List<GuesthouseResponse> content = new ArrayList<>();
        for (Document d : collection.aggregate(List.of(
                new Document("$geoNear", near),
                new Document("$skip", (long) page * size),
                new Document("$limit", size)))) {
            content.add(GuesthouseResponse.from(mongo.getConverter().read(Guesthouse.class, d)));
        }
        return PageResponse.of(content, page, size, total);
    }

    private void checkPaging(int page, int size) {
        if (page < 0) throw new BadRequestException("page must be 0 or greater");
        if (size < 1) throw new BadRequestException("size must be at least 1");
    }

    private void checkLocation(double lat, double lng) {
        if (lat < -90 || lat > 90) throw new BadRequestException("lat must be between -90 and 90");
        if (lng < -180 || lng > 180) throw new BadRequestException("lng must be between -180 and 180");
    }

    private List<String> parseAmenities(String amenities) {
        if (amenities == null || amenities.isBlank()) return List.of();
        return Arrays.stream(amenities.split(","))
                .map(a -> a.trim().toLowerCase())
                .filter(a -> !a.isEmpty())
                .toList();
    }

    // The contract's sort values. The default is cheapest first.
    private Sort buildSort(String sort) {
        String key = (sort == null || sort.isBlank()) ? "price_asc" : sort.trim().toLowerCase();
        String field;
        Sort.Direction direction;
        switch (key) {
            case "price_asc" -> { field = "pricePerNight"; direction = Sort.Direction.ASC; }
            case "price_desc" -> { field = "pricePerNight"; direction = Sort.Direction.DESC; }
            case "rating_desc" -> { field = "ratingAverage"; direction = Sort.Direction.DESC; }
            default -> throw new BadRequestException("sort must be price_asc, price_desc, rating_desc or distance");
        }
        // id as a tie-breaker keeps pages stable when two prices or ratings are equal
        return Sort.by(direction, field).and(Sort.by(Sort.Direction.ASC, "id"));
    }
}