package com.locatebase.api.guesthouse;

import java.util.List;

// How many listings changed, and which ones could not be changed and why
public record BulkStatusResponse(int updated, List<Failure> failed) {

    public record Failure(String id, String reason) {}
}