package com.locatebase.api.guesthouse;

import com.locatebase.api.common.PageResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// Owners (and admins): the rule for /api/v1/owner/** in SecurityConfig already protects this
@RestController
@RequestMapping("/api/v1/owner/guesthouses")
public class OwnerGuesthouseController {

    private final OwnerGuesthouseService service;

    public OwnerGuesthouseController(OwnerGuesthouseService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<GuesthouseResponse> listMine(@AuthenticationPrincipal Jwt jwt,
                                                     @RequestParam(defaultValue = "0") int page,
                                                     @RequestParam(defaultValue = "10") int size) {
        return service.listMine(jwt, page, size);
    }

    @PutMapping("/{id}")
    public GuesthouseResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable String id,
                                     @Valid @RequestBody OwnerGuesthouseRequest body) {
        return service.update(jwt, id, body);
    }
}
