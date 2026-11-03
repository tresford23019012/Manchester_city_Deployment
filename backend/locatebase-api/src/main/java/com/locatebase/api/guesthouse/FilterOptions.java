package com.locatebase.api.guesthouse;

import java.util.List;

// Response of GET /meta/filters
public record FilterOptions(List<String> cities, List<String> amenities) {}