package com.project.dto.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class ProductUpdateRequest {

    @Size(max = 100)
    private String name;

    private String description;

    @Size(max = 255)
    private String imageUrl;

    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal price;

    @Min(0)
    private Integer stock;

    private Integer categoryId;

    @Pattern(regexp = "on_sale|sold_out|off_shelf", message = "invalid status")
    private String status;
}
