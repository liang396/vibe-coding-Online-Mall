package com.project.entity;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class Category {

    private Integer categoryId;
    private String name;
    private Integer parentId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
