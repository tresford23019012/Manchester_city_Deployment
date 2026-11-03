package com.locatebase.api.favourite;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface FavouriteRepository extends MongoRepository<Favourite, String> {

    Page<Favourite> findByUserId(String userId, Pageable pageable);

    boolean existsByUserIdAndGuesthouseId(String userId, String guesthouseId);

    void deleteByUserIdAndGuesthouseId(String userId, String guesthouseId);
}