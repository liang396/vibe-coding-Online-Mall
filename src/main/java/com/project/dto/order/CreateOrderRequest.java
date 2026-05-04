package com.project.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Data;

@Data
public class CreateOrderRequest {

    @NotNull
    private Integer buyerId;

    @NotBlank
    @Size(max = 64)
    private String idempotencyKey;

    @Valid
    @NotEmpty
    private List<OrderItemRequest> items;
}
