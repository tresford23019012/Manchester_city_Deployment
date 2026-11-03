package com.locatebase.api.user;

import com.locatebase.api.common.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

// Admins only: the rule for /api/v1/admin/** in SecurityConfig already protects this
@RestController
@RequestMapping("/api/v1/admin")
public class AdminUserController {

    private final AdminUserService service;

    public AdminUserController(AdminUserService service) {
        this.service = service;
    }

    @GetMapping("/users")
    public PageResponse<AdminUserResponse> list(@RequestParam(required = false) String role,
                                                @RequestParam(required = false) String search,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "10") int size) {
        return service.list(role, search, page, size);
    }

    @GetMapping("/users/{id}")
    public AdminUserResponse get(@PathVariable String id) {
        return service.get(id);
    }

    @PatchMapping("/users/{id}/block")
    public AdminUserResponse block(@PathVariable String id, @Valid @RequestBody BlockRequest body) {
        return service.setBlocked(id, body.blocked());
    }

    @PostMapping("/admins")
    @ResponseStatus(HttpStatus.CREATED)
    public AdminUserResponse createAdmin(@Valid @RequestBody CreateAdminRequest body) {
        return service.makeAdmin(body.email());
    }
}