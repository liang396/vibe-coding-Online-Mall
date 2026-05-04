package com.project.service;

import com.project.dto.product.ProductDetailResponse;
import com.project.entity.Product;
import com.project.exception.NotFoundException;
import com.project.repository.CategoryRepository;
import com.project.repository.ProductRepository;
import com.project.security.AuthenticatedUser;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static com.project.config.RedisCacheConfig.PRODUCT_DETAIL_CACHE;
import static com.project.config.RedisCacheConfig.PRODUCT_LIST_CACHE;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductCacheService productCacheService;

    @Mock
    private ProductDetailCacheService productDetailCacheService;

    @Mock
    private CacheManager cacheManager;

    @Mock
    private Cache detailCache;

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private SetOperations<String, String> setOperations;

    private ProductService productService;
    private ProductDetailCacheService cacheService;

    @BeforeEach
    void setUp() {
        productService = new ProductService(productRepository, categoryRepository, productCacheService, productDetailCacheService);
        cacheService = new ProductDetailCacheService(cacheManager, stringRedisTemplate);
    }

    @Test
    void getDetailUsesHotspotLockAndCachesLoadedProduct() {
        Product product = product(1001, 101, "键盘");
        when(cacheManager.getCache(PRODUCT_DETAIL_CACHE)).thenReturn(detailCache);
        when(detailCache.get(1001)).thenReturn(null);
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(PRODUCT_DETAIL_CACHE + ":null:" + 1001)).thenReturn(null);
        when(valueOperations.setIfAbsent(eq(PRODUCT_DETAIL_CACHE + ":lock:" + 1001), eq("1"), any())).thenReturn(true);

        ProductDetailResponse response = cacheService.getOrLoad(1001, () -> new ProductDetailResponse(
                product.getProductId(),
                product.getSellerId(),
                product.getCategoryId(),
                product.getName(),
                product.getDescription(),
                product.getImageUrl(),
                product.getPrice(),
                product.getStock(),
                product.getStatus()));

        assertEquals(1001, response.getProductId());
        verify(detailCache).put(eq(1001), any(ProductDetailResponse.class));
        verify(stringRedisTemplate).delete(PRODUCT_DETAIL_CACHE + ":lock:" + 1001);
    }

    @Test
    void getDetailCachesNullMarkerForMissingProduct() {
        when(cacheManager.getCache(PRODUCT_DETAIL_CACHE)).thenReturn(detailCache);
        when(detailCache.get(9999)).thenReturn(null);
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(PRODUCT_DETAIL_CACHE + ":null:" + 9999)).thenReturn(null);
        when(valueOperations.setIfAbsent(eq(PRODUCT_DETAIL_CACHE + ":lock:" + 9999), eq("1"), any())).thenReturn(true);

        assertThrows(NotFoundException.class, () -> cacheService.getOrLoad(9999, () -> {
            throw new NotFoundException("Product not found");
        }));

        verify(valueOperations).set(eq(PRODUCT_DETAIL_CACHE + ":null:" + 9999), eq("__NULL__"), any());
    }

    @Test
    void listTracksFineGrainedCacheKey() {
        when(productRepository.findAll(null, "keyboard", 11, 0)).thenReturn(Collections.emptyList());

        productService.list(null, "keyboard", 1, 11);

        verify(productCacheService).trackProductListKey("all:keyboard:1:11");
    }

    @Test
    void buildListCacheKeyNormalizesValues() {
        assertEquals("all::1:10", productService.buildListCacheKey(null, null, 0, 0));
        assertEquals("2:key:3:20", productService.buildListCacheKey(2, " key ", 3, 20));
    }

    @Test
    void evictProductsClearsTrackedListKeysInsteadOfWholeCache() {
        ProductCacheService service = new ProductCacheService(cacheManager, stringRedisTemplate);
        when(cacheManager.getCache(PRODUCT_DETAIL_CACHE)).thenReturn(detailCache);
        Cache listCache = org.mockito.Mockito.mock(Cache.class);
        when(cacheManager.getCache(PRODUCT_LIST_CACHE)).thenReturn(listCache);
        when(stringRedisTemplate.opsForSet()).thenReturn(setOperations);
        when(setOperations.members(PRODUCT_LIST_CACHE + ":keys")).thenReturn(Set.of("all::1:10", "1:key:2:10"));

        service.evictProducts(Set.of(1001, 1002));

        verify(detailCache).evict(1001);
        verify(detailCache).evict(1002);
        verify(listCache).evict("all::1:10");
        verify(listCache).evict("1:key:2:10");
        verify(stringRedisTemplate).delete(PRODUCT_LIST_CACHE + ":keys");
        verify(listCache, never()).clear();
    }

    private Product product(int productId, int sellerId, String name) {
        Product product = new Product();
        product.setProductId(productId);
        product.setSellerId(sellerId);
        product.setCategoryId(1);
        product.setName(name);
        product.setDescription("desc");
        product.setImageUrl("img");
        product.setPrice(new BigDecimal("99.00"));
        product.setStock(3);
        product.setStatus("on_sale");
        return product;
    }
}
