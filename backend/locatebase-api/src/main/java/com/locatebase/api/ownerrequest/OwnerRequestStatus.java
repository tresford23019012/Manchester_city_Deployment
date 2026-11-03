package com.locatebase.api.ownerrequest;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;


public enum OwnerRequestStatus {
    PENDING,
    APPROVED,
    REJECTED,
    REP_DISPATCHED,
    DATA_COLLECTED,
    PUBLISHED;

    @JsonValue 
    public String toJson() {
        return name().toLowerCase();
    }


    @JsonCreator
    public static OwnerRequestStatus fromJson(String value) {
        return OwnerRequestStatus.valueOf(value.trim().toUpperCase());

    }
}