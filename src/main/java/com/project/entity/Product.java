package com.project.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class Product {

    private Integer productId;
    private Integer sellerId;
    private String name;
    private String description;
    private String imageUrl;
    private BigDecimal price;
    private Integer stock;
    private Integer categoryId;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
