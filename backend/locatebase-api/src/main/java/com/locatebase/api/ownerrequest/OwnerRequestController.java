package com.locatebase.api.ownerrequest;

import com.locatebase.api.common.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

// Owners (and admins): the rule for /api/v1/owner/** in SecurityConfig already protects this
@RestController
@RequestMapping("/api/v1/owner/requests")
public class OwnerRequestController {

    private final OwnerRequestService service;

    public OwnerRequestController(OwnerRequestService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OwnerRequestResponse create(@AuthenticationPrincipal Jwt jwt,
                                       @Valid @RequestBody OwnerRequestInput body) {
        return service.create(jwt, body);
    }

    @GetMapping
    public PageResponse<OwnerRequestResponse> list(@AuthenticationPrincipal Jwt jwt,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "10") int size) {
        return service.listMine(jwt, page, size);
    }

    @GetMapping("/{id}")
    public OwnerRequestResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable String id) {
        return service.getMine(jwt, id);
    }
}
