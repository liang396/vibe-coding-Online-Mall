package com.project.controller;

import com.project.dto.ApiSuccessResponse;
import com.project.dto.LoginResponse;
import com.project.dto.user.LoginRequest;
import com.project.dto.user.RegisterRequest;
import com.project.dto.user.RegisterResponse;
import com.project.dto.user.UpdateUserRoleRequest;
import com.project.dto.user.UpdateUserRequest;
import com.project.dto.user.UserResponse;
import com.project.security.SecurityUtils;
import com.project.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public RegisterResponse register(@Valid @RequestBody RegisterRequest request) {
        return userService.register(request);
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return userService.login(request);
    }

    @GetMapping("/{userId}")
    public UserResponse getById(@PathVariable Integer userId) {
        return userService.getById(userId, SecurityUtils.getCurrentUser());
    }

    @PutMapping("/{userId}")
    public ApiSuccessResponse update(@PathVariable Integer userId, @Valid @RequestBody UpdateUserRequest request) {
        userService.update(userId, request, SecurityUtils.getCurrentUser());
        return ApiSuccessResponse.ok();
    }

    @PutMapping("/{userId}/role")
    public UserResponse switchRole(@PathVariable Integer userId, @Valid @RequestBody UpdateUserRoleRequest request) {
        return userService.switchRole(userId, request, SecurityUtils.getCurrentUser());
    }
}
