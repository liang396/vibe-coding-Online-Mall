package com.project.repository;

import com.project.entity.Product;
import java.util.List;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface ProductRepository {

    @Select("""
            <script>
            SELECT product_id, seller_id, name, description, image_url, price, stock, category_id, status, created_at, updated_at
            FROM products
            WHERE 1 = 1
            <if test="categoryId != null">AND category_id = #{categoryId}</if>
            <if test="keyword != null and keyword != ''">
                AND (name LIKE CONCAT('%', #{keyword}, '%') OR description LIKE CONCAT('%', #{keyword}, '%'))
            </if>
            ORDER BY updated_at DESC
            LIMIT #{size} OFFSET #{offset}
            </script>
            """)
    List<Product> findAll(
            @Param("categoryId") Integer categoryId,
            @Param("keyword") String keyword,
            @Param("size") Integer size,
            @Param("offset") Integer offset);

    @Select("""
            SELECT product_id, seller_id, name, description, image_url, price, stock, category_id, status, created_at, updated_at
            FROM products
            WHERE seller_id = #{sellerId}
            ORDER BY updated_at DESC
            """)
    List<Product> findBySellerId(Integer sellerId);

    @Select("""
            SELECT product_id, seller_id, name, description, image_url, price, stock, category_id, status, created_at, updated_at
            FROM products
            WHERE product_id = #{productId}
            """)
    Product findById(Integer productId);

    @Insert("""
            INSERT INTO products (seller_id, name, description, image_url, price, stock, category_id, status)
            VALUES (#{sellerId}, #{name}, #{description}, #{imageUrl}, #{price}, #{stock}, #{categoryId}, #{status})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "productId", keyColumn = "product_id")
    int insert(Product product);

    @Update("""
            <script>
            UPDATE products
            <set>
                <if test="name != null and name != ''">name = #{name},</if>
                <if test="description != null">description = #{description},</if>
                <if test="imageUrl != null">image_url = #{imageUrl},</if>
                <if test="price != null">price = #{price},</if>
                <if test="stock != null">stock = #{stock},</if>
                <if test="categoryId != null">category_id = #{categoryId},</if>
                <if test="status != null and status != ''">status = #{status},</if>
            </set>
            WHERE product_id = #{productId}
            </script>
            """)
    int update(Product product);

    @Delete("""
            DELETE FROM products
            WHERE product_id = #{productId}
            """)
    int deleteById(Integer productId);

    @Update("""
            UPDATE products
            SET stock = stock - #{quantity},
                status = CASE WHEN stock - #{quantity} <= 0 THEN 'sold_out' ELSE status END
            WHERE product_id = #{productId} AND stock >= #{quantity}
            """)
    int decreaseStock(@Param("productId") Integer productId, @Param("quantity") Integer quantity);

    @Update("""
            UPDATE products
            SET stock = stock + #{quantity},
                status = CASE
                    WHEN status = 'off_shelf' THEN 'off_shelf'
                    WHEN stock + #{quantity} > 0 THEN 'on_sale'
                    ELSE 'sold_out'
                END
            WHERE product_id = #{productId}
            """)
    int increaseStock(@Param("productId") Integer productId, @Param("quantity") Integer quantity);
}
