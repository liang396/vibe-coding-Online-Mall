package com.project.dto.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateReviewRequest {

    @NotNull
    private Integer productId;

    @NotNull
    private Integer userId;

    @NotNull
    @Min(1)
    @Max(5)
    private Integer rating;

    private String comment;
}
