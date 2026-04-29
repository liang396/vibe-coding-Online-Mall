package com.project.service;

import org.springframework.stereotype.Service;

@Service
public class HealthService {

    public String getStatus() {
        return "online";
    }
}
