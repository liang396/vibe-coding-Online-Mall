package com.project.service;

import com.project.dto.LoginResponse;
import com.project.dto.user.LoginRequest;
import com.project.dto.user.RegisterRequest;
import com.project.dto.user.RegisterResponse;
import com.project.dto.user.UpdateUserRoleRequest;
import com.project.dto.user.UpdateUserRequest;
import com.project.dto.user.UserResponse;
import com.project.entity.User;
import com.project.exception.BadRequestException;
import com.project.exception.NotFoundException;
import com.project.exception.UnauthorizedException;
import com.project.repository.UserRepository;
import com.project.security.AuthenticatedUser;
import com.project.security.TokenService;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()) != null) {
            throw new BadRequestException("Username already exists");
        }
        if (userRepository.findByEmail(request.getEmail()) != null) {
            throw new BadRequestException("Email already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(resolveInitialRole(request.getRole()));
        user.setRoles(resolveAvailableRoles(request.getRole()));
        userRepository.insert(user);
        return new RegisterResponse(true, user.getUserId());
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByIdentifier(request.getIdentifier().trim());
        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid username/email or password");
        }
        return new LoginResponse(true, tokenService.generateToken(user.getUserId()), user.getUserId());
    }

    public UserResponse getById(Integer userId, AuthenticatedUser currentUser) {
        ensureSelfOrAdmin(userId, currentUser);
        User user = requireUser(userId);
        return toResponse(user);
    }

    public void update(Integer userId, UpdateUserRequest request, AuthenticatedUser currentUser) {
        ensureSelfOrAdmin(userId, currentUser);
        User existing = requireUser(userId);
        if (request.getUsername() == null && request.getEmail() == null && request.getPhone() == null) {
            throw new BadRequestException("No fields to update");
        }

        if (request.getUsername() != null && !request.getUsername().equals(existing.getUsername())) {
            User userByUsername = userRepository.findByUsername(request.getUsername());
            if (userByUsername != null) {
                throw new BadRequestException("Username already exists");
            }
        }
        if (request.getEmail() != null && !request.getEmail().equals(existing.getEmail())) {
            User userByEmail = userRepository.findByEmail(request.getEmail());
            if (userByEmail != null) {
                throw new BadRequestException("Email already exists");
            }
        }

        User user = new User();
        user.setUserId(userId);
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        userRepository.update(user);
    }

    public UserResponse switchRole(Integer userId, UpdateUserRoleRequest request, AuthenticatedUser currentUser) {
        ensureSelfOrAdmin(userId, currentUser);
        User user = requireUser(userId);
        List<String> availableRoles = parseRoles(user.getRoles());
        if (!availableRoles.contains(request.getRole())) {
            throw new BadRequestException("Role is not available for this account");
        }
        userRepository.updateRole(userId, request.getRole());
        user.setRole(request.getRole());
        return toResponse(user);
    }

    public User requireUser(Integer userId) {
        User user = userRepository.findById(userId);
        if (user == null) {
            throw new NotFoundException("User not found");
        }
        return user;
    }

    private void ensureSelfOrAdmin(Integer userId, AuthenticatedUser currentUser) {
        if (!currentUser.getUserId().equals(userId) && !"admin".equals(currentUser.getRole())) {
            throw new UnauthorizedException("No permission");
        }
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getUserId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                parseRoles(user.getRoles()),
                user.getPhone());
    }

    private String resolveInitialRole(String requestedRole) {
        return "buyer";
    }

    private String resolveAvailableRoles(String requestedRole) {
        return "buyer,seller";
    }

    private List<String> parseRoles(String roles) {
        if (roles == null || roles.isBlank()) {
            return List.of("buyer", "seller");
        }
        return Arrays.stream(roles.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toList();
    }
}
