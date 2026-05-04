package com.project.service;

import static com.project.config.RedisCacheConfig.PRODUCT_REVIEW_CACHE;

import com.project.dto.review.CreateReviewRequest;
import com.project.dto.review.CreateReviewResponse;
import com.project.dto.review.ReviewResponse;
import com.project.entity.Review;
import com.project.exception.UnauthorizedException;
import com.project.repository.ReviewRepository;
import com.project.security.AuthenticatedUser;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductService productService;
    private final UserService userService;

    @CacheEvict(cacheNames = PRODUCT_REVIEW_CACHE, key = "#request.productId")
    public CreateReviewResponse create(CreateReviewRequest request, AuthenticatedUser currentUser) {
        if (!currentUser.getUserId().equals(request.getUserId()) && !"admin".equals(currentUser.getRole())) {
            throw new UnauthorizedException("No permission");
        }
        productService.requireProduct(request.getProductId());
        userService.requireUser(request.getUserId());

        Review review = new Review();
        review.setProductId(request.getProductId());
        review.setUserId(request.getUserId());
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        reviewRepository.insert(review);
        return new CreateReviewResponse(true, review.getReviewId());
    }

    @Cacheable(cacheNames = PRODUCT_REVIEW_CACHE, key = "#productId", sync = true)
    public List<ReviewResponse> listByProduct(Integer productId) {
        productService.requireProduct(productId);
        return new ArrayList<>(reviewRepository.findByProductId(productId)
                .stream()
                .map(review -> new ReviewResponse(review.getReviewId(), review.getUserId(), review.getRating(), review.getComment()))
                .collect(Collectors.toList()));
    }
}
