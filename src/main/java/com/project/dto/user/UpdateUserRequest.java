package com.project.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateUserRequest {

    @Size(max = 50)
    private String username;

    @Email
    @Size(max = 100)
    private String email;

    @Size(max = 20)
    private String phone;
}
