package com.locatebase.api.contact;

import com.locatebase.api.common.PageResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// Admins only: the rule for /api/v1/admin/** in SecurityConfig already protects this
@RestController
@RequestMapping("/api/v1/admin/contact-messages")
public class AdminContactController {

    private final ContactService service;

    public AdminContactController(ContactService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<AdminContactMessageResponse> list(@RequestParam(required = false) String status,
                                                          @RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "10") int size) {
        return service.list(status, page, size);
    }

    @PatchMapping("/{id}")
    public AdminContactMessageResponse updateStatus(@PathVariable String id,
                                                    @Valid @RequestBody ContactStatusRequest body) {
        return service.updateStatus(id, body.status());
    }
}