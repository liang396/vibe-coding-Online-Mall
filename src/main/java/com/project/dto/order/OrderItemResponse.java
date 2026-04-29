package com.project.dto.order;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OrderItemResponse {

    private Integer productId;
    private Integer quantity;
    private BigDecimal price;
}
