package com.project.service;

import com.project.dto.order.CreateOrderRequest;
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
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
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

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(orderRepository, orderItemRepository, productRepository, userService, productCacheService);
    }

    @Test
    void createRejectsMixedSellerProducts() {
        CreateOrderRequest request = new CreateOrderRequest();
        request.setBuyerId(1);
        request.setItems(List.of(item(101, 1), item(102, 1)));

        Product first = product(101, 11, new BigDecimal("10.00"), 5, "on_sale");
        Product second = product(102, 22, new BigDecimal("20.00"), 5, "on_sale");
        when(productRepository.findById(101)).thenReturn(first);
        when(productRepository.findById(102)).thenReturn(second);

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> orderService.create(request, new AuthenticatedUser(1, "buyer", "buyer")));

        assertEquals("当前暂不支持不同卖家的商品合并下单，请按卖家分别提交订单", exception.getMessage());
        verify(orderRepository, never()).insert(org.mockito.ArgumentMatchers.any(Order.class));
        verify(orderItemRepository, never()).insert(org.mockito.ArgumentMatchers.any(OrderItem.class));
    }

    @Test
    void updateStatusRestoresStockWhenCancelled() {
        Order order = new Order();
        order.setOrderId(200);
        order.setBuyerId(1);
        order.setStatus("pending");
        when(orderRepository.findById(200)).thenReturn(order);
        when(orderRepository.updateStatus(200, "cancelled")).thenReturn(1);
        when(orderItemRepository.findByOrderId(200)).thenReturn(List.of(orderItem(101, 2), orderItem(102, 1)));

        orderService.updateStatus(200, "cancelled", new AuthenticatedUser(1, "buyer", "buyer"));

        verify(productRepository).increaseStock(101, 2);
        verify(productRepository).increaseStock(102, 1);
        verify(productCacheService).evictProducts(List.of(101, 102));
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
        verify(orderRepository, never()).updateStatus(300, "shipped");
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
