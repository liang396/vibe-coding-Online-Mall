package com.project.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateUserRoleRequest {

    @NotBlank
    @Pattern(regexp = "buyer|seller|admin", message = "role must be buyer, seller, or admin")
    private String role;
}
