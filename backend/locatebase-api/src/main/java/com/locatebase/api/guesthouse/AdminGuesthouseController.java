package com.locatebase.api.guesthouse;

import com.locatebase.api.common.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

// Admins only: the rule for /api/v1/admin/** in SecurityConfig already protects this
@RestController
@RequestMapping("/api/v1/admin/guesthouses")
public class AdminGuesthouseController {

    private final AdminGuesthouseService service;

    public AdminGuesthouseController(AdminGuesthouseService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<GuesthouseResponse> list(@RequestParam(required = false) String search,
                                                 @RequestParam(required = false) String status,
                                                 @RequestParam(required = false) String city,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "10") int size) {
        return service.list(search, status, city, page, size);
    }

    @GetMapping("/{id}")
    public GuesthouseResponse get(@PathVariable String id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GuesthouseResponse create(@Valid @RequestBody GuesthouseRequest body) {
        return service.create(body);
    }

    @PutMapping("/{id}")
    public GuesthouseResponse update(@PathVariable String id, @Valid @RequestBody GuesthouseRequest body) {
        return service.update(id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        service.delete(id);
    }

    @PatchMapping("/{id}/status")
    public GuesthouseResponse updateStatus(@PathVariable String id,
                                           @Valid @RequestBody GuesthouseStatusRequest body) {
        return service.updateStatus(id, body.status());
    }

    @PostMapping("/bulk-status")
    public BulkStatusResponse bulkStatus(@Valid @RequestBody BulkStatusRequest body) {
        return service.bulkStatus(body.ids(), body.status());
    }
}