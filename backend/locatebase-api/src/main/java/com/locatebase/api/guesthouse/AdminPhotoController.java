package com.locatebase.api.guesthouse;

import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

// Admins only. All three endpoints return the updated guesthouse.
@RestController
@RequestMapping("/api/v1/admin/guesthouses/{id}/photos")
public class AdminPhotoController {

    private final PhotoService service;

    public AdminPhotoController(PhotoService service) {
        this.service = service;
    }

    // multipart/form-data with one or more parts named "files"
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public GuesthouseResponse upload(@PathVariable String id, @RequestParam("files") List<MultipartFile> files) {
        return service.add(id, files);
    }

    @DeleteMapping("/{publicId}")
    public GuesthouseResponse remove(@PathVariable String id, @PathVariable String publicId) {
        return service.remove(id, publicId);
    }

    @PutMapping("/order")
    public GuesthouseResponse reorder(@PathVariable String id, @Valid @RequestBody ReorderRequest body) {
        return service.reorder(id, body.publicIds());
    }
}
