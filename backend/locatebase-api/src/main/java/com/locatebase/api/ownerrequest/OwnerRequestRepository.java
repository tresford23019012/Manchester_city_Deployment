package com.locatebase.api.ownerrequest;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface OwnerRequestRepository extends MongoRepository<OwnerRequest, String> {

    Page<OwnerRequest> findByOwnerId(String ownerId, Pageable pageable);

    Page<OwnerRequest> findByStatus(OwnerRequestStatus status, Pageable pageable);

    Optional<OwnerRequest> findByIdAndOwnerId(String id, String ownerId);

    long countByOwnerIdAndStatus(String ownerId, OwnerRequestStatus status);
}
