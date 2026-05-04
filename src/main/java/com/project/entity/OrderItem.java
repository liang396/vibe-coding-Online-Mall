package com.project.entity;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class OrderItem {

    private Integer orderItemId;
    private Integer orderId;
    private Integer productId;
    private Integer quantity;
    private BigDecimal price;
    private String productName;
}
