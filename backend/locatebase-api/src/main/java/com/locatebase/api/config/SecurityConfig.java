package com.locatebase.api.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;

import java.io.IOException;
import java.time.Instant;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final FirebaseJwtConverter jwtConverter;

    public SecurityConfig(FirebaseJwtConverter jwtConverter) {
        this.jwtConverter = jwtConverter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        // 401: no token, a fake token or an expired token
        AuthenticationEntryPoint unauthorized = (request, response, ex) ->
                writeError(response, 401, "Unauthorized",
                        "Login required: send a valid Firebase token in the Authorization header.",
                        request.getRequestURI());

        // 403: logged in, but the role is not allowed
        AccessDeniedHandler forbidden = (request, response, ex) ->
                writeError(response, 403, "Forbidden",
                        "You do not have permission to do this.",
                        request.getRequestURI());

        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth
                        // public: health check, browsing, ratings lists and filter lists (GET only)
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/health",
                                "/api/v1/meta/**",
                                "/api/v1/guesthouses",
                                "/api/v1/guesthouses/**").permitAll()

                        // any logged-in person, even a brand-new or blocked one, may sync and see their own profile
                        .requestMatchers("/api/v1/auth/sync", "/api/v1/me").authenticated()

                        // staff only
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")

                        // owners (admins count as owners too)
                        .requestMatchers("/api/v1/owner/**").hasRole("OWNER")

                        // everything else (ratings, favourites, contact admin) needs at least a customer
                        .anyRequest().hasRole("CUSTOMER"))

                .exceptionHandling(e -> e
                        .authenticationEntryPoint(unauthorized)
                        .accessDeniedHandler(forbidden))

                // verify the Firebase token, then turn the user's stored role into permissions
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtConverter))
                        .authenticationEntryPoint(unauthorized)
                        .accessDeniedHandler(forbidden));

        return http.build();
    }

    // writes the same JSON error shape the rest of the API uses
    private static void writeError(HttpServletResponse response, int status, String error,
                                   String message, String path) throws IOException {
        String safePath = path.replace("\\", "\\\\").replace("\"", "\\\"");
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write("{\"timestamp\":\"" + Instant.now() + "\",\"status\":" + status
                + ",\"error\":\"" + error + "\",\"message\":\"" + message
                + "\",\"path\":\"" + safePath + "\",\"fieldErrors\":null}");
    }
}