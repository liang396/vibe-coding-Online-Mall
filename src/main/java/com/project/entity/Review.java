package com.project.entity;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class Review {

    private Integer reviewId;
    private Integer productId;
    private Integer userId;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}
