package com.project.repository;

import com.project.entity.Review;
import java.util.List;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface ReviewRepository {

    @Insert("""
            INSERT INTO reviews (product_id, user_id, rating, comment)
            VALUES (#{productId}, #{userId}, #{rating}, #{comment})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "reviewId", keyColumn = "review_id")
    int insert(Review review);

    @Select("""
            SELECT review_id, product_id, user_id, rating, comment, created_at
            FROM reviews
            WHERE product_id = #{productId}
            ORDER BY created_at DESC
            """)
    List<Review> findByProductId(Integer productId);
}
