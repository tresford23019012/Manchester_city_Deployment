package com.locatebase.api.user;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface AppUserRepository extends MongoRepository<AppUser, String> {
    Optional<AppUser> findByFirebaseUid(String firebaseUid);

    Optional<AppUser> findByEmailIgnoreCase(String email);
}