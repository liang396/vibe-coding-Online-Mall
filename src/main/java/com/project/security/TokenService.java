package com.project.security;

import java.time.Duration;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TokenService {

    private static final String TOKEN_PREFIX = "auth:token:";
    private static final Duration TOKEN_TTL = Duration.ofDays(7);

    private final StringRedisTemplate stringRedisTemplate;

    public String generateToken(Integer userId) {
        String token = UUID.randomUUID().toString().replace("-", "");
        stringRedisTemplate.opsForValue().set(TOKEN_PREFIX + token, String.valueOf(userId), TOKEN_TTL);
        return token;
    }

    public Integer parseUserId(String token) {
        String value = stringRedisTemplate.opsForValue().get(TOKEN_PREFIX + token);
        if (value == null) {
            return null;
        }
        return Integer.parseInt(value);
    }
}
