package com.project.service;

import com.project.entity.Order;
import com.project.exception.BadRequestException;
import com.project.repository.OrderRepository;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrderTimeoutService {

    private static final String ORDER_TIMEOUT_LOCK_KEY = "order:timeout:scanner:lock";
    private static final Duration ORDER_TIMEOUT_LOCK_TTL = Duration.ofSeconds(50);
    private static final Duration ORDER_PENDING_TIMEOUT = Duration.ofMinutes(30);

    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final StringRedisTemplate stringRedisTemplate;

    @Scheduled(fixedDelayString = "${app.order.timeout-scan-ms:60000}")
    public void autoCancelPendingOrders() {
        boolean locked = Boolean.TRUE.equals(
                stringRedisTemplate.opsForValue().setIfAbsent(ORDER_TIMEOUT_LOCK_KEY, "1", ORDER_TIMEOUT_LOCK_TTL));
        if (!locked) {
            return;
        }

        try {
            LocalDateTime expireBefore = LocalDateTime.now().minus(ORDER_PENDING_TIMEOUT);
            List<Order> expiredOrders = orderRepository.findPendingOrdersCreatedBefore(expireBefore);
            for (Order order : expiredOrders) {
                cancelExpiredOrder(order);
            }
        } finally {
            stringRedisTemplate.delete(ORDER_TIMEOUT_LOCK_KEY);
        }
    }

    @Transactional
    void cancelExpiredOrder(Order order) {
        int updated = orderRepository.updateStatusIfCurrentStatus(order.getOrderId(), "pending", "cancelled");
        if (updated == 1) {
            orderService.restoreStockForTimeout(order.getOrderId());
        }
    }
}
