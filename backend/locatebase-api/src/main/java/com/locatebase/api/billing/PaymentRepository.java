package com.locatebase.api.billing;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PaymentRepository extends MongoRepository<Payment, String> {

    // the most recent 24 entries, newest first
    List<Payment> findTop24ByGuesthouseIdOrderByCreatedAtDesc(String guesthouseId);
}
