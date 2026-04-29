package com.project.dto.order;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CreateOrderResponse {

    private boolean success;
    private Integer orderId;
}
