package com.locatebase.api.contact;

import java.time.Instant;

// What admins see: the sender's details are included
public record AdminContactMessageResponse(String id, String userId, String userName, String userEmail,
                                          String subject, String message, String status, Instant createdAt) {

    public static AdminContactMessageResponse from(ContactMessage m) {
        return new AdminContactMessageResponse(m.getId(), m.getUserId(), m.getUserName(), m.getUserEmail(),
                m.getSubject(), m.getMessage(), m.getStatus(), m.getCreatedAt());
    }
}