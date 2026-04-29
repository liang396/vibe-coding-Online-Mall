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
            SELECT order_item_id, order_id, product_id, quantity, price
            FROM order_items
            WHERE order_id = #{orderId}
            ORDER BY order_item_id ASC
            """)
    List<OrderItem> findByOrderId(Integer orderId);
}
