package com.project.dto.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateOrderStatusRequest {

    @NotBlank
    @Pattern(regexp = "pending|paid|shipped|completed|cancelled", message = "invalid status")
    private String status;
}
