package com.project.repository;

import com.project.entity.OrderItem;
import java.util.List;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface OrderItemRepository {

    @Insert("""
            INSERT INTO order_items (order_id, product_id, quantity, price)
            VALUES (#{orderId}, #{productId}, #{quantity}, #{price})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "orderItemId", keyColumn = "order_item_id")
    int insert(OrderItem orderItem);

    @Select("""
            SELECT oi.order_item_id,
                   oi.order_id,
                   oi.product_id,
                   oi.quantity,
                   oi.price,
                   p.name AS productName
            FROM order_items oi
            JOIN products p ON p.product_id = oi.product_id
            WHERE oi.order_id = #{orderId}
            ORDER BY oi.order_item_id ASC
            """)
    List<OrderItem> findByOrderId(Long orderId);
}
