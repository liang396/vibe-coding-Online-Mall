package com.project.service;

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
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductCacheService productCacheService;
    private final ProductDetailCacheService productDetailCacheService;

    @Cacheable(cacheNames = PRODUCT_LIST_CACHE, key = "#root.target.buildListCacheKey(#categoryId, #keyword, #page, #size)", sync = true)
    public List<ProductSummaryResponse> list(Integer categoryId, String keyword, Integer page, Integer size) {
        int safePage = page == null || page < 1 ? 1 : page;
        int safeSize = size == null || size < 1 ? 10 : Math.min(size, 100);
        int offset = (safePage - 1) * safeSize;
        String cacheKey = buildListCacheKey(categoryId, keyword, page, size);
        productCacheService.trackProductListKey(cacheKey);
        return new ArrayList<>(productRepository.findAll(categoryId, keyword, safeSize, offset)
                .stream()
                .map(this::toSummary)
                .collect(Collectors.toList()));
    }

    public List<ProductSummaryResponse> listBySeller(AuthenticatedUser currentUser) {
        ensureSeller(currentUser);
        return new ArrayList<>(productRepository.findBySellerId(currentUser.getUserId())
                .stream()
                .map(this::toSummary)
                .collect(Collectors.toList()));
    }

    public ProductDetailResponse getDetail(Integer productId) {
        return productDetailCacheService.getOrLoad(productId, () -> toDetail(requireProduct(productId)));
    }

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
        productCacheService.evictProduct(product.getProductId());
        return new CreateProductResponse(true, product.getProductId());
    }

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
        productCacheService.evictProduct(productId);
    }

    public void delete(Integer productId, AuthenticatedUser currentUser) {
        Product existing = requireProduct(productId);
        ensureSellerOwnerOrAdmin(existing, currentUser);
        productRepository.deleteById(productId);
        productCacheService.evictProduct(productId);
    }

    public Product requireProduct(Integer productId) {
        Product product = productRepository.findById(productId);
        if (product == null) {
            throw new NotFoundException("Product not found");
        }
        return product;
    }

    public String buildListCacheKey(Integer categoryId, String keyword, Integer page, Integer size) {
        int safePage = page == null || page < 1 ? 1 : page;
        int safeSize = size == null || size < 1 ? 10 : Math.min(size, 100);
        String safeKeyword = keyword == null ? "" : keyword.trim();
        return (categoryId == null ? "all" : categoryId) + ":" + safeKeyword + ":" + safePage + ":" + safeSize;
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

    private ProductSummaryResponse toSummary(Product product) {
        return new ProductSummaryResponse(
                product.getProductId(),
                product.getCategoryId(),
                product.getName(),
                product.getDescription(),
                product.getImageUrl(),
                product.getPrice(),
                product.getStock(),
                product.getStatus());
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
