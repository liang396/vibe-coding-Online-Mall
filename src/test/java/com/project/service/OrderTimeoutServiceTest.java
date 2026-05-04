package com.project.service;

import com.project.entity.Order;
import com.project.repository.OrderRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderTimeoutServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderService orderService;

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private OrderTimeoutService orderTimeoutService;

    @BeforeEach
    void setUp() {
        orderTimeoutService = new OrderTimeoutService(orderRepository, orderService, stringRedisTemplate);
    }

    @Test
    void autoCancelPendingOrdersCancelsExpiredOrders() {
        Order expiredOrder = new Order();
        expiredOrder.setOrderId(501L);
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("order:timeout:scanner:lock"), eq("1"), any())).thenReturn(true);
        when(orderRepository.findPendingOrdersCreatedBefore(any(LocalDateTime.class))).thenReturn(List.of(expiredOrder));
        when(orderRepository.updateStatusIfCurrentStatus(501L, "pending", "cancelled")).thenReturn(1);

        orderTimeoutService.autoCancelPendingOrders();

        verify(orderService).restoreStockForTimeout(501L);
        verify(stringRedisTemplate).delete("order:timeout:scanner:lock");
    }

    @Test
    void autoCancelPendingOrdersSkipsWhenAnotherScannerOwnsLock() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq("order:timeout:scanner:lock"), eq("1"), any())).thenReturn(false);

        orderTimeoutService.autoCancelPendingOrders();

        verify(orderRepository, never()).findPendingOrdersCreatedBefore(any(LocalDateTime.class));
        verify(orderService, never()).restoreStockForTimeout(any());
    }
}
