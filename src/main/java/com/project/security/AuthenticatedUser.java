package com.project.security;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthenticatedUser {

    private Integer userId;
    private String username;
    private String role;
}
