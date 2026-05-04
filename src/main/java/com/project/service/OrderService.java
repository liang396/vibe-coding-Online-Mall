package com.project.service;

import com.project.dto.order.CreateOrderRequest;
import com.project.dto.order.CreateOrderResponse;
import com.project.dto.order.OrderDetailResponse;
import com.project.dto.order.OrderItemRequest;
import com.project.dto.order.OrderItemResponse;
import com.project.dto.order.OrderSummaryResponse;
import com.project.entity.Order;
import com.project.entity.OrderItem;
import com.project.entity.Product;
import com.project.exception.BadRequestException;
import com.project.exception.NotFoundException;
import com.project.exception.UnauthorizedException;
import com.project.repository.OrderItemRepository;
import com.project.repository.OrderRepository;
import com.project.repository.ProductRepository;
import com.project.security.AuthenticatedUser;
import java.math.BigDecimal;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrderService {

    private static final String STATUS_PENDING = "pending";
    private static final String STATUS_PAID = "paid";
    private static final String STATUS_SHIPPED = "shipped";
    private static final String STATUS_COMPLETED = "completed";
    private static final String STATUS_CANCELLED = "cancelled";
    private static final String ORDER_IDEMPOTENCY_PREFIX = "order:idempotency:";
    private static final Duration ORDER_IDEMPOTENCY_TTL = Duration.ofMinutes(10);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final UserService userService;
    private final ProductCacheService productCacheService;
    private final StringRedisTemplate stringRedisTemplate;

    @Transactional
    public CreateOrderResponse create(CreateOrderRequest request, AuthenticatedUser currentUser) {
        ensureBuyerSelfOrAdmin(request.getBuyerId(), currentUser);
        userService.requireUser(request.getBuyerId());

        String idempotencyKey = buildOrderIdempotencyKey(request.getBuyerId(), request.getIdempotencyKey());
        Integer existingOrderId = readIdempotentOrderId(idempotencyKey);
        if (existingOrderId != null) {
            return new CreateOrderResponse(true, existingOrderId);
        }
        if (!Boolean.TRUE.equals(stringRedisTemplate.opsForValue().setIfAbsent(idempotencyKey, "PENDING", ORDER_IDEMPOTENCY_TTL))) {
            throw new BadRequestException("订单正在处理中，请勿重复提交");
        }

        try {
            BigDecimal totalPrice = BigDecimal.ZERO;
            Integer sellerId = null;
            List<Product> products = new ArrayList<>();
            for (OrderItemRequest item : request.getItems()) {
                Product product = productRepository.findById(item.getProductId());
                if (product == null) {
                    throw new NotFoundException("Product not found: " + item.getProductId());
                }
                if (!"on_sale".equals(product.getStatus())) {
                    throw new BadRequestException("Product is not available: " + item.getProductId());
                }
                if (product.getStock() < item.getQuantity()) {
                    throw new BadRequestException("Insufficient stock for product: " + item.getProductId());
                }
                if (sellerId == null) {
                    sellerId = product.getSellerId();
                } else if (!sellerId.equals(product.getSellerId())) {
                    throw new BadRequestException("当前暂不支持不同卖家的商品合并下单，请按卖家分别提交订单");
                }
                totalPrice = totalPrice.add(product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
                products.add(product);
            }

            Order order = new Order();
            order.setBuyerId(request.getBuyerId());
            order.setTotalPrice(totalPrice);
            order.setStatus(STATUS_PENDING);
            orderRepository.insert(order);

            for (int index = 0; index < request.getItems().size(); index++) {
                OrderItemRequest item = request.getItems().get(index);
                Product product = products.get(index);
                int updated = productRepository.decreaseStock(item.getProductId(), item.getQuantity());
                if (updated == 0) {
                    throw new BadRequestException("Failed to lock stock for product: " + item.getProductId());
                }

                OrderItem orderItem = new OrderItem();
                orderItem.setOrderId(order.getOrderId());
                orderItem.setProductId(item.getProductId());
                orderItem.setQuantity(item.getQuantity());
                orderItem.setPrice(product.getPrice());
                orderItemRepository.insert(orderItem);
            }

            productCacheService.evictProducts(
                    request.getItems().stream().map(OrderItemRequest::getProductId).toList());
            rememberCreatedOrder(idempotencyKey, order.getOrderId());
            return new CreateOrderResponse(true, order.getOrderId());
        } catch (RuntimeException exception) {
            stringRedisTemplate.delete(idempotencyKey);
            throw exception;
        }
    }

    public List<OrderSummaryResponse> list(Integer userId, String status, String scope, AuthenticatedUser currentUser) {
        List<Order> orders;
        if ("seller".equalsIgnoreCase(scope)) {
            ensureSellerOrAdmin(currentUser);
            orders = orderRepository.findAllBySellerId(currentUser.getUserId(), status);
        } else {
            Integer effectiveUserId = userId;
            if (effectiveUserId == null && !"admin".equals(currentUser.getRole())) {
                effectiveUserId = currentUser.getUserId();
            }
            if (effectiveUserId != null) {
                ensureBuyerSelfOrAdmin(effectiveUserId, currentUser);
            }
            orders = orderRepository.findAll(effectiveUserId, status);
        }

        return orders.stream()
                .map(order -> new OrderSummaryResponse(
                        order.getOrderId(),
                        order.getTotalPrice(),
                        order.getStatus(),
                        order.getCreatedAt()))
                .toList();
    }

    public OrderDetailResponse getDetail(Integer orderId, AuthenticatedUser currentUser) {
        Order order = requireOrder(orderId);
        ensureOrderAccessible(order, currentUser);
        List<OrderItemResponse> items = orderItemRepository.findByOrderId(orderId)
                .stream()
                .map(item -> new OrderItemResponse(item.getProductId(), item.getProductName(), item.getQuantity(), item.getPrice()))
                .toList();
        return new OrderDetailResponse(
                order.getOrderId(),
                order.getBuyerId(),
                order.getTotalPrice(),
                order.getStatus(),
                order.getCreatedAt(),
                items);
    }

    @Transactional
    public void updateStatus(Integer orderId, String nextStatus, AuthenticatedUser currentUser) {
        Order order = requireOrder(orderId);
        String currentStatus = order.getStatus();
        validateStatusTransition(order, nextStatus, currentUser);

        if (currentStatus.equals(nextStatus)) {
            return;
        }

        int updated = orderRepository.updateStatusIfCurrentStatus(orderId, currentStatus, nextStatus);
        if (updated == 0) {
            throw new BadRequestException("订单状态已变更，请刷新后重试");
        }
        if (STATUS_CANCELLED.equals(nextStatus)) {
            restoreStock(orderId);
        }
    }

    @Transactional
    public void restoreStockForTimeout(Integer orderId) {
        restoreStock(orderId);
    }

    private Order requireOrder(Integer orderId) {
        Order order = orderRepository.findById(orderId);
        if (order == null) {
            throw new NotFoundException("Order not found");
        }
        return order;
    }

    private void ensureBuyerSelfOrAdmin(Integer buyerId, AuthenticatedUser currentUser) {
        if (!currentUser.getUserId().equals(buyerId) && !"admin".equals(currentUser.getRole())) {
            throw new UnauthorizedException("No permission");
        }
    }

    private void ensureSellerOrAdmin(AuthenticatedUser currentUser) {
        if (!"seller".equals(currentUser.getRole()) && !"admin".equals(currentUser.getRole())) {
            throw new UnauthorizedException("Only sellers can access seller orders");
        }
    }

    private void ensureOrderAccessible(Order order, AuthenticatedUser currentUser) {
        if ("admin".equals(currentUser.getRole())) {
            return;
        }
        if ("seller".equals(currentUser.getRole())) {
            if (orderRepository.countSellerAccess(order.getOrderId(), currentUser.getUserId()) == 0) {
                throw new UnauthorizedException("No permission");
            }
            return;
        }
        ensureBuyerSelfOrAdmin(order.getBuyerId(), currentUser);
    }

    private void validateStatusTransition(Order order, String nextStatus, AuthenticatedUser currentUser) {
        String currentStatus = order.getStatus();
        if (currentStatus.equals(nextStatus)) {
            return;
        }

        if ("admin".equals(currentUser.getRole())) {
            validateAdminTransition(currentStatus, nextStatus);
            return;
        }

        if ("seller".equals(currentUser.getRole())) {
            if (orderRepository.countSellerAccess(order.getOrderId(), currentUser.getUserId()) == 0) {
                throw new UnauthorizedException("No permission");
            }
            if (orderRepository.countDistinctSellers(order.getOrderId()) > 1) {
                throw new BadRequestException("该订单包含多个卖家的商品，当前不支持卖家直接发货");
            }
            if (STATUS_PAID.equals(currentStatus) && STATUS_SHIPPED.equals(nextStatus)) {
                return;
            }
            throw new BadRequestException("Sellers can only ship paid orders");
        }

        ensureBuyerSelfOrAdmin(order.getBuyerId(), currentUser);
        if (STATUS_PENDING.equals(currentStatus)
                && (STATUS_PAID.equals(nextStatus) || STATUS_CANCELLED.equals(nextStatus))) {
            return;
        }
        if (STATUS_SHIPPED.equals(currentStatus) && STATUS_COMPLETED.equals(nextStatus)) {
            return;
        }
        throw new BadRequestException("Buyers can only pay or cancel pending orders, or confirm receipt");
    }

    private void validateAdminTransition(String currentStatus, String nextStatus) {
        boolean allowed =
                (STATUS_PENDING.equals(currentStatus)
                                && (STATUS_PAID.equals(nextStatus) || STATUS_CANCELLED.equals(nextStatus)))
                        || (STATUS_PAID.equals(currentStatus) && STATUS_SHIPPED.equals(nextStatus))
                        || (STATUS_SHIPPED.equals(currentStatus) && STATUS_COMPLETED.equals(nextStatus));
        if (!allowed) {
            throw new BadRequestException("Invalid order status transition");
        }
    }

    private void restoreStock(Integer orderId) {
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        for (OrderItem item : items) {
            productRepository.increaseStock(item.getProductId(), item.getQuantity());
        }
        productCacheService.evictProducts(items.stream().map(OrderItem::getProductId).toList());
    }

    private String buildOrderIdempotencyKey(Integer buyerId, String requestKey) {
        return ORDER_IDEMPOTENCY_PREFIX + buyerId + ":" + requestKey.trim();
    }

    private Integer readIdempotentOrderId(String key) {
        String value = stringRedisTemplate.opsForValue().get(key);
        if (value == null || "PENDING".equals(value)) {
            return null;
        }
        return Integer.valueOf(value);
    }

    private void rememberCreatedOrder(String key, Integer orderId) {
        stringRedisTemplate.opsForValue().set(key, String.valueOf(orderId), ORDER_IDEMPOTENCY_TTL);
    }
}
