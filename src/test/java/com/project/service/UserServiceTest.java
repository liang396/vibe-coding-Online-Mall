package com.project.service;

import com.project.dto.user.RegisterRequest;
import com.project.entity.User;
import com.project.repository.UserRepository;
import com.project.security.TokenService;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private TokenService tokenService;

    private UserService userService;
    private Validator validator;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, passwordEncoder, tokenService);
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void registerRequestRejectsAdminRole() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("buyer1");
        request.setEmail("buyer1@example.com");
        request.setPassword("secret12");
        request.setRole("admin");

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);

        assertTrue(violations.stream()
                .anyMatch(violation -> "role".equals(violation.getPropertyPath().toString())
                        && violation.getMessage().contains("buyer or seller")));
    }

    @Test
    void registerAlwaysCreatesBuyerAccount() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("seller1");
        request.setEmail("seller1@example.com");
        request.setPassword("secret12");
        request.setRole("seller");

        when(userRepository.findByUsername("seller1")).thenReturn(null);
        when(userRepository.findByEmail("seller1@example.com")).thenReturn(null);
        when(passwordEncoder.encode("secret12")).thenReturn("encoded-password");

        userService.register(request);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).insert(captor.capture());
        assertEquals("buyer", captor.getValue().getRole());
        assertEquals("buyer,seller", captor.getValue().getRoles());
    }
}
