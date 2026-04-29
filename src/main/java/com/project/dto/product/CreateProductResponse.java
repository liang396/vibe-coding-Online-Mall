package com.project.dto.product;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CreateProductResponse {

    private boolean success;
    private Integer productId;
}
