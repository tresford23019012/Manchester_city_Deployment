package com.locatebase.api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// Runs before everything else, so a flood is stopped early
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MS = 60_000;
    private static final int READ_LIMIT = 300;
    private static final int WRITE_LIMIT = 60;

    private static final class Window {
        long start;
        int count;
    }

    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // browser pre-flight checks and the health check are never limited
        return "OPTIONS".equalsIgnoreCase(request.getMethod()) || request.getRequestURI().equals("/api/v1/health");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String method = request.getMethod();
        boolean write = !"GET".equalsIgnoreCase(method) && !"HEAD".equalsIgnoreCase(method);
        int limit = write ? WRITE_LIMIT : READ_LIMIT;
        String key = request.getRemoteAddr() + (write ? "|write" : "|read");

        long now = System.currentTimeMillis();
        Window w = windows.computeIfAbsent(key, k -> new Window());
        boolean allowed;
        long retryAfter;
        synchronized (w) {
            if (now - w.start >= WINDOW_MS) {
                w.start = now;
                w.count = 0;
            }
            w.count++;
            allowed = w.count <= limit;
            retryAfter = Math.max(1, (w.start + WINDOW_MS - now + 999) / 1000);
        }
        if (windows.size() > 10_000) {
            windows.entrySet().removeIf(e -> now - e.getValue().start >= WINDOW_MS);
        }

        if (!allowed) {
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(retryAfter));
            response.setContentType("application/json");
            response.getWriter().write("{\"timestamp\":\"" + Instant.now() + "\",\"status\":429,"
                    + "\"error\":\"Too Many Requests\",\"message\":\"Too many requests. Please wait "
                    + retryAfter + " seconds and try again.\",\"path\":\"" + request.getRequestURI()
                    + "\",\"fieldErrors\":null}");
            return;
        }
        chain.doFilter(request, response);
    }
}
