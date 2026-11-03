package com.locatebase.api.user;

// Optional body of POST /auth/sync. The web app's owner sign-up sends { "role": "owner" }.
public record SyncRequest(String role) {}
