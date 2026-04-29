package com.project.dto.user;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank
    @Size(max = 100)
    @JsonAlias({"username", "email"})
    private String identifier;

    @NotBlank
    @Size(max = 100)
    private String password;
}
