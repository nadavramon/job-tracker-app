package com.nadavramon.job_tracker.service;

import com.nadavramon.job_tracker.entity.RefreshToken;
import com.nadavramon.job_tracker.entity.User;
import com.nadavramon.job_tracker.enums.ThemePreference;
import com.nadavramon.job_tracker.exception.InvalidCredentialsException;
import com.nadavramon.job_tracker.exception.TokenTheftException;
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
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

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

    @Test
    void theftDetection_revokesEntireFamily_andPersistsDespiteException() {
        User user = persistUser();
        UUID familyId = UUID.randomUUID();
        // 'stolen' token was already rotated once, so it is revoked; a live descendant exists in the same family.
        persistToken(user, familyId, "stolen-token", true);
        persistToken(user, familyId, "live-descendant", false);

        assertThrows(TokenTheftException.class,
                () -> refreshTokenService.rotateRefreshToken("stolen-token"));

        // Fresh read in a new transaction: the family revocation must have COMMITTED.
        RefreshToken descendant = refreshTokenRepository.findByToken("live-descendant").orElseThrow();
        assertTrue(descendant.isRevoked(),
                "family revocation must persist despite the TokenTheftException rollback");
    }

    @Test
    void concurrentRotation_oneSucceeds_otherGets401_never500() throws Exception {
        User user = persistUser();
        persistToken(user, UUID.randomUUID(), "shared-token", false);

        CyclicBarrier barrier = new CyclicBarrier(2);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        Callable<Object> task = () -> {
            barrier.await();
            try {
                return refreshTokenService.rotateRefreshToken("shared-token");
            } catch (Exception e) {
                return e;
            }
        };
        Future<Object> f1 = pool.submit(task);
        Future<Object> f2 = pool.submit(task);
        List<Object> outcomes = List.of(f1.get(10, TimeUnit.SECONDS), f2.get(10, TimeUnit.SECONDS));
        pool.shutdownNow();

        long successes = outcomes.stream()
                .filter(o -> o instanceof RefreshTokenService.RotationResult).count();
        assertEquals(1, successes, "exactly one concurrent rotation should succeed");

        Object failure = outcomes.stream().filter(o -> o instanceof Exception).findFirst().orElseThrow();
        assertTrue(failure instanceof InvalidCredentialsException || failure instanceof TokenTheftException,
                "the losing rotation must map to a 401-class exception, not a 500; got: " + failure.getClass());

        // No-leak invariant: the loser's transaction rolled back, so only the winner's new token was
        // added (original now-revoked + 1 new = 2). @BeforeEach guarantees a clean slate.
        assertEquals(2, refreshTokenRepository.count(),
                "the losing rotation must not persist a new token");
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
