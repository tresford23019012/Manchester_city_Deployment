package com.locatebase.api.rating;

import com.locatebase.api.common.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/guesthouses/{guesthouseId}/ratings")
public class RatingController {

    private final RatingService service;

    public RatingController(RatingService service) {
        this.service = service;
    }

    // public
    @GetMapping
    public PageResponse<RatingResponse> list(@PathVariable String guesthouseId,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "10") int size) {
        return service.list(guesthouseId, page, size);
    }

    // public
    @GetMapping("/summary")
    public RatingSummary summary(@PathVariable String guesthouseId) {
        return service.summary(guesthouseId);
    }

    // login required
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RatingResponse create(@PathVariable String guesthouseId, @AuthenticationPrincipal Jwt jwt,
                                 @Valid @RequestBody RatingRequest body) {
        return service.create(guesthouseId, jwt, body);
    }

    @PutMapping("/mine")
    public RatingResponse updateMine(@PathVariable String guesthouseId, @AuthenticationPrincipal Jwt jwt,
                                     @Valid @RequestBody RatingRequest body) {
        return service.updateMine(guesthouseId, jwt, body);
    }

    @DeleteMapping("/mine")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMine(@PathVariable String guesthouseId, @AuthenticationPrincipal Jwt jwt) {
        service.deleteMine(guesthouseId, jwt);
    }
}