package com.project.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.ai")
public class AiProperties {

    private boolean enabled = false;
    private String baseUrl;
    private String apiKey;
    private String model;
    private int timeoutMs = 8000;
    private int maxHistoryMessages = 8;
    private int rateLimitPerMinute = 20;
}
