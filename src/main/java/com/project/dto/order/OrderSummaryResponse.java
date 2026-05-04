package com.project.dto.order;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OrderSummaryResponse {

    @JsonSerialize(using = ToStringSerializer.class)
    private Long orderId;
    private BigDecimal totalPrice;
    private String status;
    private LocalDateTime createdAt;
}
