package com.nadavramon.job_tracker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.nadavramon.job_tracker.config.JwtAuthenticationFilter;
import com.nadavramon.job_tracker.config.RateLimitFilter;
import com.nadavramon.job_tracker.config.SecurityConfig;
import com.nadavramon.job_tracker.dto.LoginRequest;
import com.nadavramon.job_tracker.dto.RegisterRequest;
import com.nadavramon.job_tracker.entity.User;
import com.nadavramon.job_tracker.exception.DuplicateResourceException;
import com.nadavramon.job_tracker.exception.InvalidCredentialsException;
import com.nadavramon.job_tracker.exception.TokenTheftException;
import com.nadavramon.job_tracker.service.AuthService;
import com.nadavramon.job_tracker.service.JwtService;
import com.nadavramon.job_tracker.service.RefreshTokenService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, RateLimitFilter.class})
@TestPropertySource(properties = {"cookie.secure=false", "rate-limit.auth.max-requests=100"})
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private RefreshTokenService refreshTokenService;

    private User createTestUser(String username) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername(username);
        user.setEmail(username + "@test.com");
        return user;
    }

    private void assertSetCookieContains(MvcResult result, String expected) {
        List<String> setCookieHeaders = result.getResponse().getHeaders("Set-Cookie");
        boolean found = setCookieHeaders.stream().anyMatch(h -> h.contains(expected));
        assertTrue(found, "Expected Set-Cookie header containing '" + expected
                + "' but got: " + setCookieHeaders);
    }

    // --- Login ---

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
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

    @Test
    void login_ReturnsBadRequest_WhenIdentifierIsMissing() throws Exception {
        LoginRequest invalidRequest = new LoginRequest();
        invalidRequest.setPassword("password123");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void login_SetsBothCookiesOnSuccess() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setIdentifier("test@test.com");
        loginRequest.setPassword("password123");

        User user = createTestUser("testuser");
        when(authService.login(any(LoginRequest.class))).thenReturn(user);
        when(jwtService.generateToken("testuser")).thenReturn("login-token");
        when(jwtService.getJwtExpiration()).thenReturn(900000L);
        when(refreshTokenService.createRefreshTokenForNewSession(user)).thenReturn("refresh-token-value");

        MvcResult result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"))
                .andReturn();

        assertSetCookieContains(result, "jwt=login-token");
        assertSetCookieContains(result, "refresh=refresh-token-value");
        assertSetCookieContains(result, "HttpOnly");
    }

    // --- Register ---

    @Test
    void register_ReturnsSuccess_WithBothCookies() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("new@test.com");
        request.setUsername("newuser");
        request.setPassword("password123");

        User user = createTestUser("newuser");
        when(authService.register(any(RegisterRequest.class))).thenReturn(user);
        when(jwtService.generateToken("newuser")).thenReturn("mock-token");
        when(jwtService.getJwtExpiration()).thenReturn(900000L);
        when(refreshTokenService.createRefreshTokenForNewSession(user)).thenReturn("refresh-token-value");

        MvcResult result = mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.username").value("newuser"))
                .andReturn();

        assertSetCookieContains(result, "jwt=mock-token");
        assertSetCookieContains(result, "refresh=refresh-token-value");
        assertSetCookieContains(result, "HttpOnly");
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

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    // --- Logout ---

    @Test
    void logout_ClearsBothCookies() throws Exception {
        MvcResult result = mockMvc.perform(post("/auth/logout"))
                .andExpect(status().isOk())
                .andReturn();

        assertSetCookieContains(result, "jwt=;");
        assertSetCookieContains(result, "Max-Age=0");
        assertSetCookieContains(result, "refresh=;");
    }

    @Test
    @WithMockUser(username = "testuser")
    void logout_RevokesRefreshTokens_WhenAuthenticated() throws Exception {
        User user = createTestUser("testuser");
        when(authService.findByUsername("testuser")).thenReturn(user);

        mockMvc.perform(post("/auth/logout"))
                .andExpect(status().isOk());

        verify(refreshTokenService).revokeAllUserTokens(user);
    }

    // --- Refresh ---

    @Test
    void refresh_ReturnsNewTokens_WhenValidRefreshCookie() throws Exception {
        User user = createTestUser("testuser");
        RefreshTokenService.RotationResult rotationResult =
                new RefreshTokenService.RotationResult("new-refresh", user);
        when(refreshTokenService.rotateRefreshToken("old-refresh")).thenReturn(rotationResult);
        when(jwtService.generateToken("testuser")).thenReturn("new-access-token");
        when(jwtService.getJwtExpiration()).thenReturn(900000L);

        MvcResult result = mockMvc.perform(post("/auth/refresh")
                        .cookie(new Cookie("refresh", "old-refresh")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"))
                .andReturn();

        assertSetCookieContains(result, "jwt=new-access-token");
        assertSetCookieContains(result, "refresh=new-refresh");
    }

    @Test
    void refresh_Returns401_WhenNoRefreshCookie() throws Exception {
        mockMvc.perform(post("/auth/refresh"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_Returns401_WhenTokenExpired() throws Exception {
        when(refreshTokenService.rotateRefreshToken("expired-token"))
                .thenThrow(new InvalidCredentialsException("Refresh token expired"));

        mockMvc.perform(post("/auth/refresh")
                        .cookie(new Cookie("refresh", "expired-token")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Refresh token expired"));
    }

    @Test
    void refresh_Returns401_WhenTheftDetected() throws Exception {
        when(refreshTokenService.rotateRefreshToken("stolen-token"))
                .thenThrow(new TokenTheftException("Session invalidated for security reasons"));

        mockMvc.perform(post("/auth/refresh")
                        .cookie(new Cookie("refresh", "stolen-token")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Session invalidated for security reasons"));
    }
}
