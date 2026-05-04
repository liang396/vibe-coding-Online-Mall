package com.project.controller;

import com.project.dto.ApiSuccessResponse;
import com.project.dto.order.CreateOrderRequest;
import com.project.dto.order.CreateOrderResponse;
import com.project.dto.order.OrderDetailResponse;
import com.project.dto.order.OrderSummaryResponse;
import com.project.dto.order.UpdateOrderStatusRequest;
import com.project.security.SecurityUtils;
import com.project.service.OrderService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public CreateOrderResponse create(
            @Valid @RequestBody CreateOrderRequest request,
            @RequestHeader(name = "X-Idempotency-Key", required = false) String idempotencyKey) {
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            request.setIdempotencyKey(idempotencyKey);
        }
        return orderService.create(request, SecurityUtils.getCurrentUser());
    }

    @GetMapping
    public List<OrderSummaryResponse> list(
            @RequestParam(name = "user_id", required = false) Integer userId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false, defaultValue = "buyer") String scope) {
        return orderService.list(userId, status, scope, SecurityUtils.getCurrentUser());
    }

    @GetMapping("/{orderId}")
    public OrderDetailResponse detail(@PathVariable Long orderId) {
        return orderService.getDetail(orderId, SecurityUtils.getCurrentUser());
    }

    @PutMapping("/{orderId}/status")
    public ApiSuccessResponse updateStatus(@PathVariable Long orderId, @Valid @RequestBody UpdateOrderStatusRequest request) {
        orderService.updateStatus(orderId, request.getStatus(), SecurityUtils.getCurrentUser());
        return ApiSuccessResponse.ok();
    }
}
