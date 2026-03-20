package com.nadavramon.job_tracker.repository;

import com.nadavramon.job_tracker.entity.RefreshToken;
import com.nadavramon.job_tracker.entity.User;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByToken(String token);

    @Modifying
    @Transactional
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.familyId = :familyId AND rt.revoked = false")
    void revokeByFamilyId(@Param("familyId") UUID familyId);

    @Modifying
    @Transactional
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.user = :user AND rt.revoked = false")
    void revokeAllByUser(@Param("user") User user);

    @Modifying
    @Transactional
    void deleteByExpiresAtBefore(Instant cutoff);
}
