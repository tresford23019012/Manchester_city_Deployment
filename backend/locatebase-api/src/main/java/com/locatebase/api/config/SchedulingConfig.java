package com.locatebase.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

// Switches on @Scheduled tasks, used by the live dashboard stream
@Configuration
@EnableScheduling
public class SchedulingConfig {}
