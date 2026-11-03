package com.locatebase.api.guesthouse;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.locatebase.api.common.BadRequestException;
import com.locatebase.api.common.NotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

// Photos live in Cloudinary. The database only keeps each photo's publicId and https url.
@Service
public class PhotoService {

    private static final Logger log = LoggerFactory.getLogger(PhotoService.class);

    public static final int MAX_PHOTOS = 7;
    private static final long MAX_BYTES = 8L * 1024 * 1024;   // 8 MB per image
    private static final Set<String> TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private final GuesthouseRepository repository;
    private Cloudinary cloudinary;   // created on first use, so the app still starts without Cloudinary settings

    public PhotoService(GuesthouseRepository repository) {
        this.repository = repository;
    }

    // Everything is checked first. If one upload fails, the ones already uploaded are removed again.
    public GuesthouseResponse add(String id, List<MultipartFile> files) {
        Guesthouse g = find(id);

        List<MultipartFile> incoming = new ArrayList<>();
        if (files != null) {
            for (MultipartFile f : files) {
                if (f != null && !f.isEmpty()) incoming.add(f);
            }
        }
        if (incoming.isEmpty()) {
            throw new BadRequestException("Send at least one image in the 'files' field.");
        }

        List<Photo> current = currentPhotos(g);
        if (current.size() + incoming.size() > MAX_PHOTOS) {
            throw new BadRequestException("A guesthouse can have at most " + MAX_PHOTOS + " photos. It has "
                    + current.size() + " and you sent " + incoming.size() + ".");
        }
        for (MultipartFile f : incoming) {
            check(f);
        }

        List<Photo> uploaded = new ArrayList<>();
        try {
            for (MultipartFile f : incoming) {
                uploaded.add(upload(f));
            }
        } catch (Exception e) {
            destroyAll(uploaded);
            log.error("Photo upload failed for guesthouse {}", id, e);
            throw new IllegalStateException("Photo upload failed");
        }

        current.addAll(uploaded);
        g.setPhotos(current);
        g.setUpdatedAt(Instant.now());
        return GuesthouseResponse.from(repository.save(g));
    }

    public GuesthouseResponse remove(String id, String publicId) {
        Guesthouse g = find(id);
        List<Photo> current = currentPhotos(g);

        Photo target = null;
        for (Photo p : current) {
            if (publicId.equals(p.getPublicId())) {
                target = p;
                break;
            }
        }
        if (target == null) {
            throw new NotFoundException("Photo not found: " + publicId);
        }

        current.remove(target);
        g.setPhotos(current);
        g.setUpdatedAt(Instant.now());
        Guesthouse saved = repository.save(g);

        destroyQuietly(target.getPublicId());   // the database is already correct even if this fails
        return GuesthouseResponse.from(saved);
    }

    // The new order must list every current photo exactly once. The first one is the cover photo.
    public GuesthouseResponse reorder(String id, List<String> publicIds) {
        Guesthouse g = find(id);
        List<Photo> current = currentPhotos(g);

        if (publicIds.size() != current.size() || new HashSet<>(publicIds).size() != publicIds.size()) {
            throw new BadRequestException("publicIds must list every photo exactly once.");
        }

        Map<String, Photo> byId = new HashMap<>();
        for (Photo p : current) {
            byId.put(p.getPublicId(), p);
        }
        List<Photo> ordered = new ArrayList<>();
        for (String publicId : publicIds) {
            Photo p = byId.get(publicId);
            if (p == null) {
                throw new BadRequestException("Unknown photo: " + publicId);
            }
            ordered.add(p);
        }

        g.setPhotos(ordered);
        g.setUpdatedAt(Instant.now());
        return GuesthouseResponse.from(repository.save(g));
    }

    // Deleting a guesthouse removes its photos from Cloudinary too (best effort, never blocks the delete)
    @EventListener
    public void onGuesthouseDeleted(GuesthouseDeleted event) {
        destroyAll(event.photos());
    }

    public void destroyAll(List<Photo> photos) {
        if (photos == null) return;
        for (Photo p : photos) {
            destroyQuietly(p.getPublicId());
        }
    }

    // HELPERS

    private Guesthouse find(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Guesthouse not found: " + id));
    }

    private List<Photo> currentPhotos(Guesthouse g) {
        return g.getPhotos() == null ? new ArrayList<>() : new ArrayList<>(g.getPhotos());
    }

    private void check(MultipartFile f) {
        String type = f.getContentType();
        if (type == null || !TYPES.contains(type.toLowerCase())) {
            throw new BadRequestException("Only JPEG, PNG or WebP images are allowed: " + f.getOriginalFilename());
        }
        if (f.getSize() > MAX_BYTES) {
            throw new BadRequestException("Each image must be 8 MB or smaller: " + f.getOriginalFilename());
        }
    }

    // The public id has no slashes on purpose, so it can sit in a URL path (DELETE .../photos/{publicId})
    private Photo upload(MultipartFile f) throws IOException {
        String publicId = "lb-" + UUID.randomUUID().toString().replace("-", "");
        Map<?, ?> result = cloudinary().uploader().upload(f.getBytes(),
                ObjectUtils.asMap("public_id", publicId, "resource_type", "image"));

        String url = (String) result.get("secure_url");
        String returnedId = (String) result.get("public_id");
        return new Photo(returnedId != null ? returnedId : publicId, url);
    }

    private void destroyQuietly(String publicId) {
        if (publicId == null) return;
        try {
            cloudinary().uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (Exception e) {
            log.warn("Could not delete photo {} from Cloudinary", publicId, e);
        }
    }

    // reads the CLOUDINARY_URL environment variable the first time it is needed
    private synchronized Cloudinary cloudinary() {
        if (cloudinary == null) {
            String url = System.getenv("CLOUDINARY_URL");
            if (url == null || url.isBlank()) {
                throw new IllegalStateException("CLOUDINARY_URL is not set");
            }
            cloudinary = new Cloudinary(url);
        }
        return cloudinary;
    }
}
