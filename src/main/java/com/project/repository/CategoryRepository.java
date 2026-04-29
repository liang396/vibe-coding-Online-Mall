package com.project.repository;

import com.project.entity.Category;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface CategoryRepository {

    @Select("""
            SELECT category_id, name, parent_id, created_at, updated_at
            FROM categories
            WHERE category_id = #{categoryId}
            """)
    Category findById(Integer categoryId);
}
