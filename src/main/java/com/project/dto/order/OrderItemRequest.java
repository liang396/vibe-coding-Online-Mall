package com.project.dto.order;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderItemRequest {

    @NotNull
    private Integer productId;

    @NotNull
    @Min(1)
    private Integer quantity;
}
