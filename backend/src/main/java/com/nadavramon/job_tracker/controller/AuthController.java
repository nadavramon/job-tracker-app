package com.nadavramon.job_tracker.controller;

import com.nadavramon.job_tracker.config.CookieConstants;
import com.nadavramon.job_tracker.dto.AuthResponse;
import com.nadavramon.job_tracker.dto.LoginRequest;
import com.nadavramon.job_tracker.dto.RegisterRequest;
import com.nadavramon.job_tracker.entity.User;
import com.nadavramon.job_tracker.service.AuthService;
import com.nadavramon.job_tracker.service.JwtService;
import com.nadavramon.job_tracker.service.RefreshTokenService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final boolean cookieSecure;
    private final long refreshTokenExpiration;

    public AuthController(AuthService authService, JwtService jwtService,
                          RefreshTokenService refreshTokenService,
                          @Value("${cookie.secure}") boolean cookieSecure,
                          @Value("${refresh-token.expiration:604800000}") long refreshTokenExpiration) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.cookieSecure = cookieSecure;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> createUser(@Valid @RequestBody RegisterRequest registerRequest) {
        User user = authService.register(registerRequest);
        return buildAuthResponse(user, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> userLogin(@Valid @RequestBody LoginRequest loginRequest) {
        User user = authService.login(loginRequest);
        return buildAuthResponse(user, HttpStatus.OK);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        String username = SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getName() : null;

        if (username != null && !"anonymousUser".equals(username)) {
            User user = authService.findByUsername(username);
            if (user != null) {
                refreshTokenService.revokeAllUserTokens(user);
            }
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearAccessCookie().toString())
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie().toString())
                .build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request) {
        String refreshToken = extractRefreshCookie(request);
        if (refreshToken == null) {
            return ResponseEntity.status(401).build();
        }

        RefreshTokenService.RotationResult result = refreshTokenService.rotateRefreshToken(refreshToken);
        String accessToken = jwtService.generateToken(result.user().getUsername());
        String newRefreshToken = result.token();

        AuthResponse response = new AuthResponse(result.user().getUsername());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildAccessCookie(accessToken).toString())
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(newRefreshToken).toString())
                .body(response);
    }

    private ResponseEntity<AuthResponse> buildAuthResponse(User user, HttpStatus status) {
        String accessToken = jwtService.generateToken(user.getUsername());
        String refreshToken = refreshTokenService.createRefreshTokenForNewSession(user);

        AuthResponse response = new AuthResponse(user.getUsername());
        return ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE, buildAccessCookie(accessToken).toString())
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(refreshToken).toString())
                .body(response);
    }

    private ResponseCookie buildAccessCookie(String token) {
        return baseAccessCookieBuilder(token)
                .maxAge(Duration.ofMillis(jwtService.getJwtExpiration()))
                .build();
    }

    private ResponseCookie buildRefreshCookie(String token) {
        return baseRefreshCookieBuilder(token)
                .maxAge(Duration.ofMillis(refreshTokenExpiration))
                .build();
    }

    private ResponseCookie clearAccessCookie() {
        return baseAccessCookieBuilder("").maxAge(0).build();
    }

    private ResponseCookie clearRefreshCookie() {
        return baseRefreshCookieBuilder("").maxAge(0).build();
    }

    private ResponseCookie.ResponseCookieBuilder baseAccessCookieBuilder(String value) {
        return ResponseCookie.from(CookieConstants.JWT_COOKIE_NAME, value)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .sameSite("Lax");
    }

    private ResponseCookie.ResponseCookieBuilder baseRefreshCookieBuilder(String value) {
        return ResponseCookie.from(CookieConstants.REFRESH_COOKIE_NAME, value)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/auth/refresh")
                .sameSite("Lax");
    }

    private String extractRefreshCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (CookieConstants.REFRESH_COOKIE_NAME.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}
