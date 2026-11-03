package com.locatebase.api.contact;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

// A message a user sent to LocateBase staff from the mobile app
@Data
@Document("contact_messages")
public class ContactMessage {

    @Id
    private String id;

    private String userId;       // who sent it
    private String userName;     // copied so admins can see it without extra lookups
    private String userEmail;

    private String subject;
    private String message;

    private String status = "new";   // "new" until an admin deals with it

    private Instant createdAt = Instant.now();
}