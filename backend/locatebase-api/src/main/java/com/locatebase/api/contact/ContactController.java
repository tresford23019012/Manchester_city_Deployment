package com.locatebase.api.contact;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ContactController {

    private final ContactService service;

    public ContactController(ContactService service) {
        this.service = service;
    }

    // any logged-in user (customer, owner or admin)
    @PostMapping("/contact-admin")
    @ResponseStatus(HttpStatus.CREATED)
    public ContactMessageResponse send(@AuthenticationPrincipal Jwt jwt,
                                       @Valid @RequestBody ContactRequest body) {
        return service.send(jwt, body);
    }
}