package com.locatebase.api.guesthouse;

import com.locatebase.api.common.PageResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/guesthouses")
public class GuesthouseController {

    private final GuesthouseService service;

    public GuesthouseController(GuesthouseService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<GuesthouseResponse> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) String amenities,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return service.search(search, city, minPrice, maxPrice, minRating, amenities, sort, lat, lng, page, size);
    }

    // Must stay above /{id}, so "nearby" is not mistaken for a guesthouse id
    @GetMapping("/nearby")
    public PageResponse<GuesthouseResponse> nearby(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return service.nearby(lat, lng, radiusKm, page, size);
    }

    @GetMapping("/{id}")
    public GuesthouseResponse get(@PathVariable String id) {
        return service.getPublicById(id);
    }
}