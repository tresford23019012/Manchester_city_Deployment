package com.locatebase.api.user;

import jakarta.validation.constraints.NotNull;

public record BlockRequest(@NotNull(message = "blocked is required") Boolean blocked) {}
