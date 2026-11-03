package com.locatebase.api.guesthouse;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/owner/guesthouses/{id}/promotions")
public class OwnerPromotionController {

    private final PromotionService service;

    public OwnerPromotionController(PromotionService service) {
        this.service = service;
    }

    @GetMapping
    public List<PromotionResponse> list(@AuthenticationPrincipal Jwt jwt, @PathVariable String id) {
        return service.list(jwt, id);
    }

    @PostMapping
    public PromotionResponse save(@AuthenticationPrincipal Jwt jwt, @PathVariable String id,
                                  @Valid @RequestBody PromotionRequest body) {
        return service.save(jwt, id, body);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void end(@AuthenticationPrincipal Jwt jwt, @PathVariable String id) {
        service.end(jwt, id);
    }
}
