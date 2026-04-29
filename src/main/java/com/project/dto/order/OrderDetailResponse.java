package com.project.dto.order;

import java.math.BigDecimal;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OrderDetailResponse {

    private Integer orderId;
    private Integer buyerId;
    private BigDecimal totalPrice;
    private String status;
    private List<OrderItemResponse> items;
}
