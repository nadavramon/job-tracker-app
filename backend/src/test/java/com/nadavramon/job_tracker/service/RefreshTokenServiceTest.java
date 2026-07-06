package com.nadavramon.job_tracker.service;

import com.nadavramon.job_tracker.entity.RefreshToken;
import com.nadavramon.job_tracker.entity.User;
import com.nadavramon.job_tracker.exception.InvalidCredentialsException;
import com.nadavramon.job_tracker.exception.TokenTheftException;
import com.nadavramon.job_tracker.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    private RefreshTokenService refreshTokenService;

    private User testUser;

    @BeforeEach
    void setUp() {
        refreshTokenService = new RefreshTokenService(refreshTokenRepository, 604800000L);

        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setUsername("testuser");
        testUser.setEmail("test@test.com");
    }

    @Test
    void createRefreshToken_CreatesTokenWithCorrectFields() {
        when(refreshTokenRepository.save(any(RefreshToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        String token = refreshTokenService.createRefreshTokenForNewSession(testUser);

        assertNotNull(token);
        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());

        RefreshToken saved = captor.getValue();
        assertEquals(testUser, saved.getUser());
        assertNotNull(saved.getFamilyId());
        assertNotNull(saved.getCreatedAt());
        assertNotNull(saved.getExpiresAt());
        assertFalse(saved.isRevoked());
    }

    @Test
    void rotateRefreshToken_Success_ReturnsNewTokenAndRevokesOld() {
        RefreshToken existingToken = createValidToken();
        when(refreshTokenRepository.findByToken("old-token")).thenReturn(Optional.of(existingToken));
        when(refreshTokenRepository.save(any(RefreshToken.class)))
                .thenAnswer(invocation -> {
                    RefreshToken t = invocation.getArgument(0);
                    if (t.getId() == null) {
                        t.setId(UUID.randomUUID());
                    }
                    return t;
                });

        RefreshTokenService.RotationResult result = refreshTokenService.rotateRefreshToken("old-token");

        assertNotNull(result.token());
        assertEquals(testUser, result.user());
        assertTrue(existingToken.isRevoked());
        assertNotNull(existingToken.getReplacedById());

        verify(refreshTokenRepository).save(any(RefreshToken.class));           // new token
        verify(refreshTokenRepository).saveAndFlush(any(RefreshToken.class));   // old token, flushed for the optimistic version check
    }

    @Test
    void rotateRefreshToken_TokenNotFound_ThrowsInvalidCredentials() {
        when(refreshTokenRepository.findByToken("unknown")).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class,
                () -> refreshTokenService.rotateRefreshToken("unknown"));
    }

    @Test
    void rotateRefreshToken_ExpiredToken_ThrowsInvalidCredentials() {
        RefreshToken expiredToken = createValidToken();
        expiredToken.setExpiresAt(Instant.now().minus(Duration.ofHours(1)));
        when(refreshTokenRepository.findByToken("expired")).thenReturn(Optional.of(expiredToken));

        assertThrows(InvalidCredentialsException.class,
                () -> refreshTokenService.rotateRefreshToken("expired"));
    }

    @Test
    void rotateRefreshToken_RevokedToken_ThrowsTokenTheftAndRevokesFamily() {
        RefreshToken revokedToken = createValidToken();
        revokedToken.setRevoked(true);
        when(refreshTokenRepository.findByToken("revoked")).thenReturn(Optional.of(revokedToken));

        assertThrows(TokenTheftException.class,
                () -> refreshTokenService.rotateRefreshToken("revoked"));

        verify(refreshTokenRepository).revokeByFamilyId(revokedToken.getFamilyId());
    }

    @Test
    void revokeAllUserTokens_DelegatesToRepository() {
        refreshTokenService.revokeAllUserTokens(testUser);
        verify(refreshTokenRepository).revokeAllByUser(testUser);
    }

    @Test
    void deleteExpiredTokens_DelegatesToRepository() {
        refreshTokenService.deleteExpiredTokens();
        verify(refreshTokenRepository).deleteByExpiresAtBefore(any(Instant.class));
    }

    private RefreshToken createValidToken() {
        RefreshToken token = new RefreshToken();
        token.setId(UUID.randomUUID());
        token.setToken("old-token");
        token.setFamilyId(UUID.randomUUID());
        token.setUser(testUser);
        token.setExpiresAt(Instant.now().plus(Duration.ofDays(7)));
        token.setRevoked(false);
        token.setCreatedAt(Instant.now().minus(Duration.ofHours(1)));
        return token;
    }
}
