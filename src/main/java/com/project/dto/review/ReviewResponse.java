package com.project.dto.review;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ReviewResponse {

    private Integer reviewId;
    private Integer userId;
    private Integer rating;
    private String comment;
}
