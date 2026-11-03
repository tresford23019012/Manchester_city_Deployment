package com.locatebase.api.contact;

import jakarta.validation.constraints.NotBlank;

public record ContactStatusRequest(@NotBlank(message = "Status is required") String status) {}