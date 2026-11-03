package com.locatebase.api.user;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Document("users")
public class AppUser {

    @Id
    private String id;

    private String firebaseUid;     // matches a login token to this record (unique)
    private String email;
    private String name;
    private String photoUrl;

    private Role role = Role.CUSTOMER;
    private boolean blocked = false;   // admins can block a user

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();
}