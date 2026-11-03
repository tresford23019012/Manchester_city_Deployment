package com.locatebase.api.dashboard;

import com.locatebase.api.dashboard.DashboardResponses.Charts;
import com.locatebase.api.dashboard.DashboardResponses.Stats;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

// Admins only: the rule for /api/v1/admin/** in SecurityConfig already protects this
@RestController
@RequestMapping("/api/v1/admin/dashboard")
public class DashboardController {

    private final DashboardService service;
    private final DashboardStreamService stream;

    public DashboardController(DashboardService service, DashboardStreamService stream) {
        this.service = service;
        this.stream = stream;
    }

    @GetMapping("/stats")
    public Stats stats() {
        return service.stats();
    }

    @GetMapping("/charts")
    public Charts charts() {
        return service.charts();
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        return stream.subscribe();
    }
}
