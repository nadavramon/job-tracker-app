package com.nadavramon.job_tracker.service;

import com.nadavramon.job_tracker.entity.RefreshToken;
import com.nadavramon.job_tracker.entity.User;
import com.nadavramon.job_tracker.exception.InvalidCredentialsException;
import com.nadavramon.job_tracker.exception.TokenTheftException;
import com.nadavramon.job_tracker.repository.RefreshTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenService.class);

    private final RefreshTokenRepository refreshTokenRepository;
    private final long refreshTokenExpiration;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
                               @Value("${refresh-token.expiration:604800000}") long refreshTokenExpiration) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    public String createRefreshTokenForNewSession(User user) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setFamilyId(UUID.randomUUID());
        refreshToken.setUser(user);
        refreshToken.setExpiresAt(Instant.now().plus(Duration.ofMillis(refreshTokenExpiration)));
        refreshToken.setRevoked(false);
        refreshToken.setCreatedAt(Instant.now());

        refreshTokenRepository.save(refreshToken);
        return refreshToken.getToken();
    }

    @Transactional
    public RotationResult rotateRefreshToken(String tokenValue) {
        RefreshToken existingToken = refreshTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid refresh token"));

        if (existingToken.isRevoked()) {
            log.warn("Refresh token theft detected for user {} in family {}",
                    existingToken.getUser().getId(), existingToken.getFamilyId());
            refreshTokenRepository.revokeByFamilyId(existingToken.getFamilyId());
            throw new TokenTheftException("Session invalidated for security reasons");
        }

        if (existingToken.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidCredentialsException("Refresh token expired");
        }

        existingToken.setRevoked(true);

        RefreshToken newToken = new RefreshToken();
        newToken.setToken(UUID.randomUUID().toString());
        newToken.setFamilyId(existingToken.getFamilyId());
        newToken.setUser(existingToken.getUser());
        newToken.setExpiresAt(Instant.now().plus(Duration.ofMillis(refreshTokenExpiration)));
        newToken.setRevoked(false);
        newToken.setCreatedAt(Instant.now());

        refreshTokenRepository.save(newToken);

        existingToken.setReplacedById(newToken.getId());
        refreshTokenRepository.save(existingToken);

        return new RotationResult(newToken.getToken(), existingToken.getUser());
    }

    @Transactional
    public void revokeAllUserTokens(User user) {
        refreshTokenRepository.revokeAllByUser(user);
    }

    public void deleteExpiredTokens() {
        refreshTokenRepository.deleteByExpiresAtBefore(Instant.now());
    }

    public record RotationResult(String token, User user) {}
}
