package com.project.service;

import static com.project.config.RedisCacheConfig.PRODUCT_DETAIL_CACHE;
import static com.project.config.RedisCacheConfig.PRODUCT_DETAIL_LOCK_TTL;
import static com.project.config.RedisCacheConfig.PRODUCT_NULL_TTL;

import com.project.dto.product.ProductDetailResponse;
import com.project.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProductDetailCacheService {

    private static final String NULL_SENTINEL = "__NULL__";
    private static final String DETAIL_LOCK_PREFIX = PRODUCT_DETAIL_CACHE + ":lock:";

    private final CacheManager cacheManager;
    private final StringRedisTemplate stringRedisTemplate;

    public ProductDetailResponse getOrLoad(Integer productId, Loader loader) {
        ProductDetailResponse cached = readCachedDetail(productId);
        if (cached != null) {
            return cached;
        }
        if (hasNullMarker(productId)) {
            throw new NotFoundException("Product not found");
        }

        String lockKey = DETAIL_LOCK_PREFIX + productId;
        boolean lockAcquired = Boolean.TRUE.equals(
                stringRedisTemplate.opsForValue().setIfAbsent(lockKey, "1", PRODUCT_DETAIL_LOCK_TTL));
        if (!lockAcquired) {
            ProductDetailResponse retried = readCachedDetail(productId);
            if (retried != null) {
                return retried;
            }
            if (hasNullMarker(productId)) {
                throw new NotFoundException("Product not found");
            }
        }

        try {
            ProductDetailResponse loaded = loader.load();
            putDetail(productId, loaded);
            clearNullMarker(productId);
            return loaded;
        } catch (NotFoundException notFoundException) {
            rememberNull(productId);
            throw notFoundException;
        } finally {
            if (lockAcquired) {
                stringRedisTemplate.delete(lockKey);
            }
        }
    }

    public void evictProduct(Integer productId) {
        Cache cache = cacheManager.getCache(PRODUCT_DETAIL_CACHE);
        if (cache != null) {
            cache.evict(productId);
        }
        clearNullMarker(productId);
    }

    private ProductDetailResponse readCachedDetail(Integer productId) {
        Cache cache = cacheManager.getCache(PRODUCT_DETAIL_CACHE);
        if (cache == null) {
            return null;
        }
        Cache.ValueWrapper wrapper = cache.get(productId);
        if (wrapper != null && wrapper.get() instanceof ProductDetailResponse cached) {
            return cached;
        }
        return null;
    }

    private boolean hasNullMarker(Integer productId) {
        return NULL_SENTINEL.equals(stringRedisTemplate.opsForValue().get(buildNullKey(productId)));
    }

    private void putDetail(Integer productId, ProductDetailResponse detail) {
        Cache cache = cacheManager.getCache(PRODUCT_DETAIL_CACHE);
        if (cache != null) {
            cache.put(productId, detail);
        }
    }

    private void rememberNull(Integer productId) {
        stringRedisTemplate.opsForValue().set(buildNullKey(productId), NULL_SENTINEL, PRODUCT_NULL_TTL);
    }

    private void clearNullMarker(Integer productId) {
        stringRedisTemplate.delete(buildNullKey(productId));
    }

    private String buildNullKey(Integer productId) {
        return PRODUCT_DETAIL_CACHE + ":null:" + productId;
    }

    @FunctionalInterface
    public interface Loader {
        ProductDetailResponse load() throws NotFoundException;
    }
}
