package com.locatebase.api.user;

// What the API returns for a user: { id, email, name, role } plus the photo
public record UserResponse(String id, String email, String name, String photoUrl, Role role) {

    public static UserResponse from(AppUser u) {
        return new UserResponse(u.getId(), u.getEmail(), u.getName(), u.getPhotoUrl(), u.getRole());
    }
}