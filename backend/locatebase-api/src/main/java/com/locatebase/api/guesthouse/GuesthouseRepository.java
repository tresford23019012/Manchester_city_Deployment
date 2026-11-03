package com.locatebase.api.guesthouse;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface GuesthouseRepository extends MongoRepository<Guesthouse, String> {
}