package com.locatebase.api.favourite;

import com.locatebase.api.common.PageResponse;
import com.locatebase.api.guesthouse.GuesthouseResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me/favourites")
public class FavouriteController {

    private final FavouriteService service;

    public FavouriteController(FavouriteService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<GuesthouseResponse> list(@AuthenticationPrincipal Jwt jwt,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "10") int size) {
        return service.list(jwt, page, size);
    }

    @PutMapping("/{guesthouseId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void add(@AuthenticationPrincipal Jwt jwt, @PathVariable String guesthouseId) {
        service.add(jwt, guesthouseId);
    }

    @DeleteMapping("/{guesthouseId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@AuthenticationPrincipal Jwt jwt, @PathVariable String guesthouseId) {
        service.remove(jwt, guesthouseId);
    }
}