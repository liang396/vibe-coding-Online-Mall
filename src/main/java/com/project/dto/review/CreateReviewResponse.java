package com.project.dto.review;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CreateReviewResponse {

    private boolean success;
    private Integer reviewId;
}
