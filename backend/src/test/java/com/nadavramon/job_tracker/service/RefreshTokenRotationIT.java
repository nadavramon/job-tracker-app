package com.nadavramon.job_tracker.service;

import com.nadavramon.job_tracker.entity.RefreshToken;
import com.nadavramon.job_tracker.entity.User;
import com.nadavramon.job_tracker.enums.ThemePreference;
import com.nadavramon.job_tracker.repository.RefreshTokenRepository;
import com.nadavramon.job_tracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@Testcontainers
class RefreshTokenRotationIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17");

    @Autowired
    RefreshTokenService refreshTokenService;
    @Autowired
    RefreshTokenRepository refreshTokenRepository;
    @Autowired
    UserRepository userRepository;

    // The ITs are not @Transactional (we need commits to be observable), so wipe state between
    // methods. Order matters: refresh_tokens has an FK to users.
    @BeforeEach
    void cleanSlate() {
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void contextLoadsAgainstRealPostgres() {
        assertNotNull(refreshTokenService);
    }

    User persistUser() {
        User u = new User();
        u.setEmail("it-" + UUID.randomUUID() + "@test.com");
        u.setUsername("it-" + UUID.randomUUID());
        u.setPassword("hashed-irrelevant");
        u.setThemePreference(ThemePreference.SYSTEM);
        return userRepository.save(u);
    }

    RefreshToken persistToken(User user, UUID familyId, String token, boolean revoked) {
        RefreshToken t = new RefreshToken();
        t.setToken(token);
        t.setFamilyId(familyId);
        t.setUser(user);
        t.setExpiresAt(Instant.now().plus(Duration.ofDays(7)));
        t.setRevoked(revoked);
        t.setCreatedAt(Instant.now());
        return refreshTokenRepository.save(t);
    }
}
