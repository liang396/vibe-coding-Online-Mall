package com.project.controller;

import com.project.dto.ApiSuccessResponse;
import com.project.dto.product.CreateProductResponse;
import com.project.dto.product.ProductCreateRequest;
import com.project.dto.product.ProductDetailResponse;
import com.project.dto.product.ProductSummaryResponse;
import com.project.dto.product.ProductUpdateRequest;
import com.project.dto.review.ReviewResponse;
import com.project.security.SecurityUtils;
import com.project.service.ProductService;
import com.project.service.ReviewService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final ReviewService reviewService;

    @GetMapping("/products")
    public List<ProductSummaryResponse> list(
            @RequestParam(name = "category_id", required = false) Integer categoryId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return productService.list(categoryId, keyword, page, size);
    }

    @GetMapping("/seller/products")
    public List<ProductSummaryResponse> listSellerProducts() {
        return productService.listBySeller(SecurityUtils.getCurrentUser());
    }

    @GetMapping("/products/{productId}")
    public ProductDetailResponse detail(@PathVariable Integer productId) {
        return productService.getDetail(productId);
    }

    @PostMapping("/products")
    public CreateProductResponse create(@Valid @RequestBody ProductCreateRequest request) {
        return productService.create(request, SecurityUtils.getCurrentUser());
    }

    @PutMapping("/products/{productId}")
    public ApiSuccessResponse update(@PathVariable Integer productId, @Valid @RequestBody ProductUpdateRequest request) {
        productService.update(productId, request, SecurityUtils.getCurrentUser());
        return ApiSuccessResponse.ok();
    }

    @DeleteMapping("/products/{productId}")
    public ApiSuccessResponse delete(@PathVariable Integer productId) {
        productService.delete(productId, SecurityUtils.getCurrentUser());
        return ApiSuccessResponse.ok();
    }

    @GetMapping("/products/{productId}/reviews")
    public List<ReviewResponse> listReviews(@PathVariable Integer productId) {
        return reviewService.listByProduct(productId);
    }
}
