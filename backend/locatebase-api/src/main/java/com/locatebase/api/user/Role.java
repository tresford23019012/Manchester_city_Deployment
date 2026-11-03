package com.locatebase.api.user;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Role {
    CUSTOMER,   // default for new accounts
    OWNER,      // guesthouse owners (can do everything a customer can)
    ADMIN;      // LocateBase staff (can do everything)

    // JSON uses lowercase, as the contract says: "customer", "owner", "admin"
    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static Role fromJson(String value) {
        return Role.valueOf(value.trim().toUpperCase());
    }
}