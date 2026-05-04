package com.project.service;

import static com.project.config.RedisCacheConfig.PRODUCT_DETAIL_CACHE;
import static com.project.config.RedisCacheConfig.PRODUCT_LIST_CACHE;

import java.util.Collection;
import java.util.LinkedHashSet;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

@Service
public class ProductCacheService {

    private final CacheManager cacheManager;

    public ProductCacheService(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    public void evictProducts(Collection<Integer> productIds) {
        Cache productDetailCache = cacheManager.getCache(PRODUCT_DETAIL_CACHE);
        if (productDetailCache != null) {
            new LinkedHashSet<>(productIds).forEach(productDetailCache::evict);
        }

        Cache productListCache = cacheManager.getCache(PRODUCT_LIST_CACHE);
        if (productListCache != null) {
            productListCache.clear();
        }
    }
}
