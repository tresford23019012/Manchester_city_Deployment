package com.locatebase.api.guesthouse;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum GuesthouseStatus {
    DRAFT,       // created by staff, not public yet
    PUBLISHED,   // visible to everyone (this was called ACTIVE before)
    SUSPENDED;   // hidden, e.g. for late payment

    // When the status is sent to an app as JSON, send it in lowercase: "published"
    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    // When an app sends a status to us, accept it in any case: "published", "Published"...
    @JsonCreator
    public static GuesthouseStatus fromJson(String value) {
        return GuesthouseStatus.valueOf(value.trim().toUpperCase());
    }
}