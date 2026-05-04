package com.project.service;

import com.project.dto.order.CreateOrderRequest;
import com.project.dto.order.CreateOrderResponse;
import com.project.dto.order.OrderItemRequest;
import com.project.entity.Order;
import com.project.entity.OrderItem;
import com.project.entity.Product;
import com.project.exception.BadRequestException;
import com.project.repository.OrderItemRepository;
import com.project.repository.OrderRepository;
import com.project.repository.ProductRepository;
import com.project.security.AuthenticatedUser;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserService userService;

    @Mock
    private ProductCacheService productCacheService;

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(
                orderRepository,
                orderItemRepository,
                productRepository,
                userService,
                productCacheService,
                stringRedisTemplate);
    }

    @Test
    void createRejectsMixedSellerProducts() {
        CreateOrderRequest request = createRequest("idem-1", item(101, 1), item(102, 1));
        Product first = product(101, 11, new BigDecimal("10.00"), 5, "on_sale");
        Product second = product(102, 22, new BigDecimal("20.00"), 5, "on_sale");
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("order:idempotency:1:idem-1")).thenReturn(null);
        when(valueOperations.setIfAbsent(eq("order:idempotency:1:idem-1"), eq("PENDING"), any())).thenReturn(true);
        when(productRepository.findById(101)).thenReturn(first);
        when(productRepository.findById(102)).thenReturn(second);

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> orderService.create(request, new AuthenticatedUser(1, "buyer", "buyer")));

        assertEquals("当前暂不支持不同卖家的商品合并下单，请按卖家分别提交订单", exception.getMessage());
        verify(orderRepository, never()).insert(any(Order.class));
        verify(orderItemRepository, never()).insert(any(OrderItem.class));
        verify(stringRedisTemplate).delete("order:idempotency:1:idem-1");
    }

    @Test
    void createReturnsExistingOrderForSameIdempotencyKey() {
        CreateOrderRequest request = createRequest("idem-2", item(101, 1));
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("order:idempotency:1:idem-2")).thenReturn("88");

        CreateOrderResponse response = orderService.create(request, new AuthenticatedUser(1, "buyer", "buyer"));

        assertEquals(88, response.getOrderId());
        verify(orderRepository, never()).insert(any(Order.class));
    }

    @Test
    void createRejectsConcurrentDuplicateSubmissionWhilePending() {
        CreateOrderRequest request = createRequest("idem-3", item(101, 1));
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("order:idempotency:1:idem-3")).thenReturn(null);
        when(valueOperations.setIfAbsent(eq("order:idempotency:1:idem-3"), eq("PENDING"), any())).thenReturn(false);

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> orderService.create(request, new AuthenticatedUser(1, "buyer", "buyer")));

        assertEquals("订单正在处理中，请勿重复提交", exception.getMessage());
        verify(orderRepository, never()).insert(any(Order.class));
    }

    @Test
    void updateStatusRestoresStockOnlyWhenCancellationTransitionSucceeds() {
        Order order = new Order();
        order.setOrderId(200);
        order.setBuyerId(1);
        order.setStatus("pending");
        when(orderRepository.findById(200)).thenReturn(order);
        when(orderRepository.updateStatusIfCurrentStatus(200, "pending", "cancelled")).thenReturn(1);
        when(orderItemRepository.findByOrderId(200)).thenReturn(List.of(orderItem(101, 2), orderItem(102, 1)));

        orderService.updateStatus(200, "cancelled", new AuthenticatedUser(1, "buyer", "buyer"));

        verify(productRepository).increaseStock(101, 2);
        verify(productRepository).increaseStock(102, 1);
        verify(productCacheService).evictProducts(List.of(101, 102));
    }

    @Test
    void updateStatusSkipsStockRestoreWhenOrderAlreadyCancelled() {
        Order order = new Order();
        order.setOrderId(201);
        order.setBuyerId(1);
        order.setStatus("cancelled");
        when(orderRepository.findById(201)).thenReturn(order);

        orderService.updateStatus(201, "cancelled", new AuthenticatedUser(1, "buyer", "buyer"));

        verify(orderRepository, never()).updateStatusIfCurrentStatus(any(), any(), any());
        verify(orderItemRepository, never()).findByOrderId(any());
        verify(productRepository, never()).increaseStock(any(), any());
    }

    @Test
    void updateStatusThrowsWhenConcurrentTransitionAlreadyChangedOrder() {
        Order order = new Order();
        order.setOrderId(202);
        order.setBuyerId(1);
        order.setStatus("pending");
        when(orderRepository.findById(202)).thenReturn(order);
        when(orderRepository.updateStatusIfCurrentStatus(202, "pending", "paid")).thenReturn(0);

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> orderService.updateStatus(202, "paid", new AuthenticatedUser(1, "buyer", "buyer")));

        assertEquals("订单状态已变更，请刷新后重试", exception.getMessage());
    }

    @Test
    void sellerCannotShipMixedSellerOrder() {
        Order order = new Order();
        order.setOrderId(300);
        order.setBuyerId(1);
        order.setStatus("paid");
        when(orderRepository.findById(300)).thenReturn(order);
        when(orderRepository.countSellerAccess(300, 11)).thenReturn(1);
        when(orderRepository.countDistinctSellers(300)).thenReturn(2);

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> orderService.updateStatus(300, "shipped", new AuthenticatedUser(11, "seller", "seller")));

        assertEquals("该订单包含多个卖家的商品，当前不支持卖家直接发货", exception.getMessage());
        verify(orderRepository, never()).updateStatusIfCurrentStatus(300, "paid", "shipped");
    }

    private CreateOrderRequest createRequest(String idempotencyKey, OrderItemRequest... items) {
        CreateOrderRequest request = new CreateOrderRequest();
        request.setBuyerId(1);
        request.setIdempotencyKey(idempotencyKey);
        request.setItems(List.of(items));
        return request;
    }

    private OrderItemRequest item(int productId, int quantity) {
        OrderItemRequest item = new OrderItemRequest();
        item.setProductId(productId);
        item.setQuantity(quantity);
        return item;
    }

    private Product product(int productId, int sellerId, BigDecimal price, int stock, String status) {
        Product product = new Product();
        product.setProductId(productId);
        product.setSellerId(sellerId);
        product.setPrice(price);
        product.setStock(stock);
        product.setStatus(status);
        return product;
    }

    private OrderItem orderItem(int productId, int quantity) {
        OrderItem orderItem = new OrderItem();
        orderItem.setProductId(productId);
        orderItem.setQuantity(quantity);
        return orderItem;
    }
}
