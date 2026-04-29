package com.project.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Data;

@Data
public class CreateOrderRequest {

    @NotNull
    private Integer buyerId;

    @Valid
    @NotEmpty
    private List<OrderItemRequest> items;
}
