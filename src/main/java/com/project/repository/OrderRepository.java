package com.project.repository;

import com.project.entity.Order;
import java.util.List;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface OrderRepository {

    @Insert("""
            INSERT INTO orders (buyer_id, total_price, status)
            VALUES (#{buyerId}, #{totalPrice}, #{status})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "orderId", keyColumn = "order_id")
    int insert(Order order);

    @Select("""
            SELECT order_id, buyer_id, total_price, status, created_at, updated_at
            FROM orders
            WHERE order_id = #{orderId}
            """)
    Order findById(Integer orderId);

    @Select("""
            <script>
            SELECT order_id, buyer_id, total_price, status, created_at, updated_at
            FROM orders
            WHERE 1 = 1
            <if test="userId != null">AND buyer_id = #{userId}</if>
            <if test="status != null and status != ''">AND status = #{status}</if>
            ORDER BY created_at DESC
            </script>
            """)
    List<Order> findAll(@Param("userId") Integer userId, @Param("status") String status);

    @Select("""
            <script>
            SELECT DISTINCT o.order_id, o.buyer_id, o.total_price, o.status, o.created_at, o.updated_at
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.order_id
            JOIN products p ON p.product_id = oi.product_id
            WHERE p.seller_id = #{sellerId}
            <if test="status != null and status != ''">AND o.status = #{status}</if>
            ORDER BY o.created_at DESC
            </script>
            """)
    List<Order> findAllBySellerId(@Param("sellerId") Integer sellerId, @Param("status") String status);

    @Select("""
            SELECT COUNT(*)
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.order_id
            JOIN products p ON p.product_id = oi.product_id
            WHERE o.order_id = #{orderId}
              AND p.seller_id = #{sellerId}
            """)
    int countSellerAccess(@Param("orderId") Integer orderId, @Param("sellerId") Integer sellerId);

    @Select("""
            SELECT COUNT(DISTINCT p.seller_id)
            FROM order_items oi
            JOIN products p ON p.product_id = oi.product_id
            WHERE oi.order_id = #{orderId}
            """)
    int countDistinctSellers(@Param("orderId") Integer orderId);

    @Update("""
            UPDATE orders
            SET status = #{status}
            WHERE order_id = #{orderId}
            """)
    int updateStatus(@Param("orderId") Integer orderId, @Param("status") String status);
}
