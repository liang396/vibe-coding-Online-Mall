package com.project.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.order-id")
public class OrderIdProperties {

    private long epochMillis = 1735689600000L;
    private long workerId = 0L;
    private long rollbackToleranceMs = 5L;
}
