package com.locatebase.api.user;

import java.time.Instant;

// What admins see about a user. The Firebase id is never exposed.
public record AdminUserResponse(String id, String email, String name, String photoUrl, Role role,
                                boolean blocked, Instant createdAt, Instant updatedAt) {

    public static AdminUserResponse from(AppUser u) {
        return new AdminUserResponse(u.getId(), u.getEmail(), u.getName(), u.getPhotoUrl(), u.getRole(),
                u.isBlocked(), u.getCreatedAt(), u.getUpdatedAt());
    }
}
