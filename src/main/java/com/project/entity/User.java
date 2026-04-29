package com.project.entity;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class User {

    private Integer userId;
    private String username;
    private String password;
    private String email;
    private String phone;
    private String role;
    private String roles;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
