package com.project.service;

import static com.project.config.RedisCacheConfig.PRODUCT_DETAIL_CACHE;
import static com.project.config.RedisCacheConfig.PRODUCT_LIST_CACHE;

import java.util.Collection;
import java.util.LinkedHashSet;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class ProductCacheService {

    private static final String PRODUCT_LIST_INDEX_KEY = PRODUCT_LIST_CACHE + ":keys";

    private final CacheManager cacheManager;
    private final StringRedisTemplate stringRedisTemplate;

    public ProductCacheService(CacheManager cacheManager, StringRedisTemplate stringRedisTemplate) {
        this.cacheManager = cacheManager;
        this.stringRedisTemplate = stringRedisTemplate;
    }

    public void evictProducts(Collection<Integer> productIds) {
        Cache productDetailCache = cacheManager.getCache(PRODUCT_DETAIL_CACHE);
        if (productDetailCache != null) {
            new LinkedHashSet<>(productIds).forEach(productDetailCache::evict);
        }
        evictTrackedProductListCaches();
    }

    public void evictProduct(Integer productId) {
        Cache productDetailCache = cacheManager.getCache(PRODUCT_DETAIL_CACHE);
        if (productDetailCache != null) {
            productDetailCache.evict(productId);
        }
        evictTrackedProductListCaches();
    }

    public void trackProductListKey(String key) {
        stringRedisTemplate.opsForSet().add(PRODUCT_LIST_INDEX_KEY, key);
    }

    private void evictTrackedProductListCaches() {
        Cache productListCache = cacheManager.getCache(PRODUCT_LIST_CACHE);
        if (productListCache == null) {
            return;
        }
        var keys = stringRedisTemplate.opsForSet().members(PRODUCT_LIST_INDEX_KEY);
        if (keys == null || keys.isEmpty()) {
            return;
        }
        keys.forEach(productListCache::evict);
        stringRedisTemplate.delete(PRODUCT_LIST_INDEX_KEY);
    }
}
