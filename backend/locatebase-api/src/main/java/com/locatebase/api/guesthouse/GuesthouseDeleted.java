package com.locatebase.api.guesthouse;

import java.util.List;

// Published when a guesthouse is deleted, so its photos can be removed from Cloudinary
public record GuesthouseDeleted(String id, List<Photo> photos) {}
