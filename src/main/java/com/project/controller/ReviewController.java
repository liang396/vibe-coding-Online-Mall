package com.project.controller;

import com.project.dto.review.CreateReviewRequest;
import com.project.dto.review.CreateReviewResponse;
import com.project.security.SecurityUtils;
import com.project.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public CreateReviewResponse create(@Valid @RequestBody CreateReviewRequest request) {
        return reviewService.create(request, SecurityUtils.getCurrentUser());
    }
}
