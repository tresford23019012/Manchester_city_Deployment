package com.locatebase.api.billing;

import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Admins only: the rule for /api/v1/admin/** in SecurityConfig already protects this
@RestController
@RequestMapping("/api/v1/admin/guesthouses/{guesthouseId}/payment")
public class BillingController {

    private final BillingService service;

    public BillingController(BillingService service) {
        this.service = service;
    }

    @GetMapping
    public PaymentResponse get(@PathVariable String guesthouseId) {
        return service.get(guesthouseId);
    }

    @PutMapping
    public PaymentResponse record(@PathVariable String guesthouseId, @AuthenticationPrincipal Jwt jwt,
                                  @Valid @RequestBody PaymentRequest body) {
        return service.record(guesthouseId, body, jwt);
    }
}
