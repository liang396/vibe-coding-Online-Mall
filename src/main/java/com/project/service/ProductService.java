package com.project.service;

import static com.project.config.RedisCacheConfig.PRODUCT_DETAIL_CACHE;
import static com.project.config.RedisCacheConfig.PRODUCT_LIST_CACHE;

import com.project.dto.product.CreateProductResponse;
import com.project.dto.product.ProductCreateRequest;
import com.project.dto.product.ProductDetailResponse;
import com.project.dto.product.ProductSummaryResponse;
import com.project.dto.product.ProductUpdateRequest;
import com.project.entity.Product;
import com.project.exception.BadRequestException;
import com.project.exception.NotFoundException;
import com.project.exception.UnauthorizedException;
import com.project.repository.CategoryRepository;
import com.project.repository.ProductRepository;
import com.project.security.AuthenticatedUser;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @Cacheable(
            cacheNames = PRODUCT_LIST_CACHE,
            key = "(#categoryId == null ? 'all' : #categoryId) + ':' + (#keyword == null ? '' : #keyword.trim()) + ':'"
                    + " + (#page == null || #page < 1 ? 1 : #page) + ':' + "
                    + "(#size == null || #size < 1 ? 10 : (#size > 100 ? 100 : #size))",
            sync = true)
    public List<ProductSummaryResponse> list(Integer categoryId, String keyword, Integer page, Integer size) {
        int safePage = page == null || page < 1 ? 1 : page;
        int safeSize = size == null || size < 1 ? 10 : Math.min(size, 100);
        int offset = (safePage - 1) * safeSize;
        return new ArrayList<>(productRepository.findAll(categoryId, keyword, safeSize, offset)
                .stream()
                .map(product -> new ProductSummaryResponse(
                        product.getProductId(),
                        product.getCategoryId(),
                        product.getName(),
                        product.getDescription(),
                        product.getImageUrl(),
                        product.getPrice(),
                        product.getStock(),
                        product.getStatus()))
                .collect(Collectors.toList()));
    }

    @Cacheable(cacheNames = PRODUCT_DETAIL_CACHE, key = "#productId", sync = true)
    public ProductDetailResponse getDetail(Integer productId) {
        Product product = requireProduct(productId);
        return toDetail(product);
    }

    @CacheEvict(cacheNames = PRODUCT_LIST_CACHE, allEntries = true)
    public CreateProductResponse create(ProductCreateRequest request, AuthenticatedUser currentUser) {
        ensureSeller(currentUser);
        validateCategory(request.getCategoryId());

        Product product = new Product();
        product.setSellerId(currentUser.getUserId());
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setImageUrl(request.getImageUrl());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        product.setCategoryId(request.getCategoryId());
        product.setStatus(request.getStock() > 0 ? "on_sale" : "sold_out");
        productRepository.insert(product);
        return new CreateProductResponse(true, product.getProductId());
    }

    @Caching(evict = {
        @CacheEvict(cacheNames = PRODUCT_LIST_CACHE, allEntries = true),
        @CacheEvict(cacheNames = PRODUCT_DETAIL_CACHE, key = "#productId")
    })
    public void update(Integer productId, ProductUpdateRequest request, AuthenticatedUser currentUser) {
        Product existing = requireProduct(productId);
        ensureSellerOwnerOrAdmin(existing, currentUser);
        if (request.getName() == null
                && request.getDescription() == null
                && request.getImageUrl() == null
                && request.getPrice() == null
                && request.getStock() == null
                && request.getCategoryId() == null
                && request.getStatus() == null) {
            throw new BadRequestException("No fields to update");
        }
        if (request.getCategoryId() != null) {
            validateCategory(request.getCategoryId());
        }

        Product product = new Product();
        product.setProductId(productId);
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setImageUrl(request.getImageUrl());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        product.setCategoryId(request.getCategoryId());
        if (request.getStatus() != null) {
            product.setStatus(request.getStatus());
        } else if (request.getStock() != null && request.getStock() == 0) {
            product.setStatus("sold_out");
        }
        productRepository.update(product);
    }

    @Caching(evict = {
        @CacheEvict(cacheNames = PRODUCT_LIST_CACHE, allEntries = true),
        @CacheEvict(cacheNames = PRODUCT_DETAIL_CACHE, key = "#productId")
    })
    public void delete(Integer productId, AuthenticatedUser currentUser) {
        Product existing = requireProduct(productId);
        ensureSellerOwnerOrAdmin(existing, currentUser);
        productRepository.deleteById(productId);
    }

    public Product requireProduct(Integer productId) {
        Product product = productRepository.findById(productId);
        if (product == null) {
            throw new NotFoundException("Product not found");
        }
        return product;
    }

    private void validateCategory(Integer categoryId) {
        if (categoryRepository.findById(categoryId) == null) {
            throw new NotFoundException("Category not found");
        }
    }

    private void ensureSeller(AuthenticatedUser currentUser) {
        if (!"seller".equals(currentUser.getRole()) && !"admin".equals(currentUser.getRole())) {
            throw new UnauthorizedException("Only sellers can manage products");
        }
    }

    private void ensureSellerOwnerOrAdmin(Product product, AuthenticatedUser currentUser) {
        if (!currentUser.getUserId().equals(product.getSellerId()) && !"admin".equals(currentUser.getRole())) {
            throw new UnauthorizedException("No permission");
        }
    }

    private ProductDetailResponse toDetail(Product product) {
        return new ProductDetailResponse(
                product.getProductId(),
                product.getSellerId(),
                product.getCategoryId(),
                product.getName(),
                product.getDescription(),
                product.getImageUrl(),
                product.getPrice(),
                product.getStock(),
                product.getStatus());
    }
}
