package com.locatebase.api.rating;

import java.util.Map;

public record RatingSummary(double average, int count, Map<String, Integer> distribution) {}