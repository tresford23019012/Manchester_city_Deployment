package com.locatebase.api.guesthouse;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/meta")
public class MetaController {

    private final GuesthouseService service;

    public MetaController(GuesthouseService service) {
        this.service = service;
    }

    @GetMapping("/filters")
    public FilterOptions filters() {
        return service.filterOptions();
    }
}