package com.project.dto.order;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OrderSummaryResponse {

    private Integer orderId;
    private BigDecimal totalPrice;
    private String status;
}
