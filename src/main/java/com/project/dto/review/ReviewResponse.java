package com.project.dto.review;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {

    private Integer reviewId;
    private Integer userId;
    private Integer rating;
    private String comment;
}
