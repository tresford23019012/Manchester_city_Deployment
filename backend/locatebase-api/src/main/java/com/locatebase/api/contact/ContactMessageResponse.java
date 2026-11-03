package com.locatebase.api.contact;

import java.time.Instant;

public record ContactMessageResponse(String id, String subject, String message, String status, Instant createdAt) {

    public static ContactMessageResponse from(ContactMessage m) {
        return new ContactMessageResponse(m.getId(), m.getSubject(), m.getMessage(), m.getStatus(), m.getCreatedAt());
    }
}