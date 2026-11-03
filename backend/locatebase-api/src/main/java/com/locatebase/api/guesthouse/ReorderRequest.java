package com.locatebase.api.guesthouse;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ReorderRequest(
        @NotNull(message = "publicIds is required")
        List<@NotBlank(message = "Photo ids cannot be blank") String> publicIds) {}
