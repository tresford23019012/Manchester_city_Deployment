package com.locatebase.api.user;

import com.locatebase.api.common.BadRequestException;
import com.locatebase.api.common.NotFoundException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;

@Service
public class UserService {

    private final AppUserRepository repository;

    public UserService(AppUserRepository repository) {
        this.repository = repository;
    }

    // Called after every sign-in: creates the user the first time, otherwise refreshes their details
    public AppUser sync(Jwt jwt, String requestedRole) {
        Role role = parseRequestedRole(requestedRole);   // checked first, so a bad value is always rejected

        String uid = jwt.getSubject();                   // the Firebase user id
        String email = jwt.getClaimAsString("email");
        String name = jwt.getClaimAsString("name");
        String picture = jwt.getClaimAsString("picture");

        Optional<AppUser> existing = repository.findByFirebaseUid(uid);
        if (existing.isPresent()) {
            AppUser user = existing.get();
            boolean changed = false;
            if (email != null && !email.equals(user.getEmail())) { user.setEmail(email); changed = true; }
            // only fill a missing name or photo; never overwrite what the user chose themselves
            if (isBlank(user.getName()) && name != null) { user.setName(name); changed = true; }
            if (isBlank(user.getPhotoUrl()) && picture != null) { user.setPhotoUrl(picture); changed = true; }
            if (changed) {
                user.setUpdatedAt(Instant.now());
                user = repository.save(user);
            }
            return user;   // an existing user's role is never changed here
        }

        AppUser user = new AppUser();
        user.setFirebaseUid(uid);
        user.setEmail(email);
        user.setName(!isBlank(name) ? name : fallbackName(email));
        user.setPhotoUrl(picture);
        user.setRole(role);
        try {
            return repository.save(user);
        } catch (DuplicateKeyException e) {
            // two first-time syncs arrived together; the other one won, so just load it
            return repository.findByFirebaseUid(uid).orElseThrow();
        }
    }

    public AppUser getMe(Jwt jwt) {
        return repository.findByFirebaseUid(jwt.getSubject())
                .orElseThrow(() -> new NotFoundException("No profile yet. Call POST /auth/sync after signing in."));
    }

    public AppUser updateMe(Jwt jwt, UpdateProfileRequest request) {
        AppUser user = getMe(jwt);
        user.setName(request.name().trim());
        user.setPhotoUrl(request.photoUrl());
        user.setUpdatedAt(Instant.now());
        return repository.save(user);
    }

    // Only "customer" or "owner" may be requested. Admin is never self-assigned.
    private Role parseRequestedRole(String requested) {
        if (requested == null || requested.isBlank()) return Role.CUSTOMER;
        switch (requested.trim().toLowerCase()) {
            case "customer": return Role.CUSTOMER;
            case "owner": return Role.OWNER;
            default: throw new BadRequestException("role must be 'customer' or 'owner'");
        }
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private String fallbackName(String email) {
        if (email != null && email.contains("@")) return email.substring(0, email.indexOf('@'));
        return "Guest";
    }
}