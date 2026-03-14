package com.nadavramon.job_tracker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.nadavramon.job_tracker.config.JwtAuthenticationFilter;
import com.nadavramon.job_tracker.config.RateLimitFilter;
import com.nadavramon.job_tracker.config.SecurityConfig;
import com.nadavramon.job_tracker.dto.AuthResponse;
import com.nadavramon.job_tracker.dto.LoginRequest;
import com.nadavramon.job_tracker.dto.RegisterRequest;
import com.nadavramon.job_tracker.exception.DuplicateResourceException;
import com.nadavramon.job_tracker.exception.InvalidCredentialsException;
import com.nadavramon.job_tracker.service.AuthService;
import com.nadavramon.job_tracker.service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, RateLimitFilter.class})
@TestPropertySource(properties = "cookie.secure=false")
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtService jwtService;

    @Test
    void login_ReturnsUnauthorized_WhenCredentialsAreWrong() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setIdentifier("test@test.com");
        loginRequest.setPassword("wrongPassword");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new InvalidCredentialsException("Invalid credentials"));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized()) // Expect 401
                .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

    @Test
    void login_ReturnsBadRequest_WhenIdentifierIsMissing() throws Exception {
        LoginRequest invalidRequest = new LoginRequest();
        // identifier is missing
        invalidRequest.setPassword("password123");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest()) // Expect 400
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void register_ReturnsSuccess_WhenValidRequest() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("new@test.com");
        request.setUsername("newuser");
        request.setPassword("password123");

        AuthResponse response = new AuthResponse("newuser");
        when(authService.register(any(RegisterRequest.class))).thenReturn(response);
        when(jwtService.generateToken("newuser")).thenReturn("mock-token");
        when(jwtService.getJwtExpiration()).thenReturn(86400000L);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.username").value("newuser"))
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(header().string("Set-Cookie", containsString("jwt=mock-token")))
                .andExpect(header().string("Set-Cookie", containsString("HttpOnly")))
                .andExpect(header().string("Set-Cookie", containsString("Path=/")));
    }

    @Test
    void register_ReturnsConflict_WhenEmailExists() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("existing@test.com");
        request.setUsername("newuser");
        request.setPassword("password123");

        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new DuplicateResourceException("Registration failed"));

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Registration failed"));
    }

    @Test
    void register_ReturnsBadRequest_WhenEmailMissing() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newuser");
        request.setPassword("password123");
        // email is missing

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void login_SetsCookieOnSuccess() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setIdentifier("test@test.com");
        loginRequest.setPassword("password123");

        AuthResponse response = new AuthResponse("testuser");
        when(authService.login(any(LoginRequest.class))).thenReturn(response);
        when(jwtService.generateToken("testuser")).thenReturn("login-token");
        when(jwtService.getJwtExpiration()).thenReturn(86400000L);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(header().string("Set-Cookie", containsString("jwt=login-token")))
                .andExpect(header().string("Set-Cookie", containsString("HttpOnly")));
    }

    @Test
    void logout_ClearsCookie() throws Exception {
        mockMvc.perform(post("/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(header().string("Set-Cookie", containsString("jwt=")))
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));
    }
}
