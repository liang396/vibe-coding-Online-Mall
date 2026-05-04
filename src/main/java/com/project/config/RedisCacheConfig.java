package com.project.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
@EnableCaching
public class RedisCacheConfig {

    public static final String PRODUCT_LIST_CACHE = "product:list:v5";
    public static final String PRODUCT_DETAIL_CACHE = "product:detail:v5";
    public static final String PRODUCT_REVIEW_CACHE = "product:review:v5";
    public static final Duration PRODUCT_NULL_TTL = Duration.ofSeconds(30);
    public static final Duration PRODUCT_DETAIL_LOCK_TTL = Duration.ofSeconds(10);

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory, ObjectMapper objectMapper) {
        GenericJackson2JsonRedisSerializer serializer = new GenericJackson2JsonRedisSerializer(objectMapper);
        RedisCacheConfiguration defaultConfiguration = RedisCacheConfiguration.defaultCacheConfig()
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(serializer));

        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        cacheConfigurations.put(PRODUCT_LIST_CACHE, defaultConfiguration.entryTtl(Duration.ofMinutes(3)));
        cacheConfigurations.put(PRODUCT_DETAIL_CACHE, defaultConfiguration.entryTtl(Duration.ofMinutes(10)));
        cacheConfigurations.put(PRODUCT_REVIEW_CACHE, defaultConfiguration.entryTtl(Duration.ofMinutes(5)));

        return RedisCacheManager.builder(redisConnectionFactory)
                .cacheDefaults(defaultConfiguration.entryTtl(Duration.ofMinutes(5)))
                .withInitialCacheConfigurations(cacheConfigurations)
                .transactionAware()
                .build();
    }
}
