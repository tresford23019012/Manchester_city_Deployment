package com.locatebase.api.common;

import java.time.Instant;
import java.util.Map;

// The one error shape every endpoint uses. fieldErrors maps a field name to the reason it was rejected.
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> fieldErrors) {

    public static ApiError of(int status, String error, String message, String path) {
        return new ApiError(Instant.now(), status, error, message, path, null);
    }
}