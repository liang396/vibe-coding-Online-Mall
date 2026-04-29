package com.project.repository;

import com.project.entity.User;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface UserRepository {

    @Insert("""
            INSERT INTO users (username, password, email, phone, role, roles)
            VALUES (#{username}, #{password}, #{email}, #{phone}, #{role}, #{roles})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "userId", keyColumn = "user_id")
    int insert(User user);

    @Select("""
            SELECT user_id, username, password, email, phone, role, roles, created_at, updated_at
            FROM users
            WHERE user_id = #{userId}
            """)
    User findById(Integer userId);

    @Select("""
            SELECT user_id, username, password, email, phone, role, roles, created_at, updated_at
            FROM users
            WHERE username = #{username}
            """)
    User findByUsername(String username);

    @Select("""
            SELECT user_id, username, password, email, phone, role, roles, created_at, updated_at
            FROM users
            WHERE email = #{email}
            """)
    User findByEmail(String email);

    @Select("""
            SELECT user_id, username, password, email, phone, role, roles, created_at, updated_at
            FROM users
            WHERE username = #{identifier} OR email = #{identifier}
            LIMIT 1
            """)
    User findByIdentifier(String identifier);

    @Update("""
            <script>
            UPDATE users
            <set>
                <if test="username != null and username != ''">username = #{username},</if>
                <if test="email != null and email != ''">email = #{email},</if>
                <if test="phone != null">phone = #{phone},</if>
            </set>
            WHERE user_id = #{userId}
            </script>
            """)
    int update(User user);

    @Update("""
            UPDATE users
            SET role = #{role}
            WHERE user_id = #{userId}
            """)
    int updateRole(@Param("userId") Integer userId, @Param("role") String role);
}
