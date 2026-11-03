package com.locatebase.api.ownerrequest;

import com.locatebase.api.common.PageResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// Admins only: the rule for /api/v1/admin/** in SecurityConfig already protects this
@RestController
@RequestMapping("/api/v1/admin/requests")
public class AdminRequestController {

    private final AdminRequestService service;

    public AdminRequestController(AdminRequestService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<OwnerRequestResponse> list(@RequestParam(required = false) String status,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "10") int size) {
        return service.list(status, page, size);
    }

    @GetMapping("/{id}")
    public OwnerRequestResponse get(@PathVariable String id) {
        return service.get(id);
    }

    @PostMapping("/{id}/approve")
    public OwnerRequestResponse approve(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
        return service.approve(id, jwt);
    }

    @PostMapping("/{id}/reject")
    public OwnerRequestResponse reject(@PathVariable String id, @AuthenticationPrincipal Jwt jwt,
                                       @Valid @RequestBody RejectRequest body) {
        return service.reject(id, body.reason(), jwt);
    }

    @PostMapping("/{id}/dispatch-rep")
    public OwnerRequestResponse dispatchRep(@PathVariable String id, @AuthenticationPrincipal Jwt jwt,
                                            @Valid @RequestBody DispatchRepRequest body) {
        return service.dispatchRep(id, body, jwt);
    }

    @PostMapping("/{id}/mark-data-collected")
    public OwnerRequestResponse markDataCollected(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
        return service.markDataCollected(id, jwt);
    }
}
