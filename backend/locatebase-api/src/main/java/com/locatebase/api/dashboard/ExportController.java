package com.locatebase.api.dashboard;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;

// Admins only: the rule for /api/v1/admin/** in SecurityConfig already protects this
@RestController
@RequestMapping("/api/v1/admin/export")
public class ExportController {

    private final ExportService service;

    public ExportController(ExportService service) {
        this.service = service;
    }

    @GetMapping("/guesthouses.csv")
    public ResponseEntity<byte[]> guesthouses() {
        return csv("guesthouses.csv", service.guesthousesCsv());
    }

    @GetMapping("/users.csv")
    public ResponseEntity<byte[]> users() {
        return csv("users.csv", service.usersCsv());
    }

    private ResponseEntity<byte[]> csv(String filename, byte[] body) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(body);
    }
}
