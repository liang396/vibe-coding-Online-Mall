package com.project.dto.user;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserResponse {

    private Integer userId;
    private String username;
    private String email;
    private String role;
    private List<String> roles;
    private String phone;
}
