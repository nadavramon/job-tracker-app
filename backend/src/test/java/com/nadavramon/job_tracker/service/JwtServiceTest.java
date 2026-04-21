package com.nadavramon.job_tracker.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.*;

public class JwtServiceTest {

    private JwtService jwtService;

    private static final String VALID_SECRET = "this-is-a-very-long-secret-key-for-jwt-testing-purposes-1234567890";
    private static final long EXPIRATION_MS = 900_000; // 15 minutes

    @BeforeEach
    void setUp() throws Exception {
        jwtService = new JwtService();
        setField(jwtService, "secretKey", VALID_SECRET);
        setField(jwtService, "jwtExpiration", EXPIRATION_MS);
        jwtService.init();
    }

    private void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    // ── init (@PostConstruct) ─────────────────────────────────────────────

    @Test
    void init_ThrowsIllegalState_WhenSecretIsNull() throws Exception {
        JwtService service = new JwtService();
        setField(service, "secretKey", null);

        assertThrows(IllegalStateException.class, service::init);
    }

    @Test
    void init_ThrowsIllegalState_WhenSecretIsTooShort() throws Exception {
        JwtService service = new JwtService();
        setField(service, "secretKey", "short");

        IllegalStateException ex = assertThrows(IllegalStateException.class, service::init);
        assertTrue(ex.getMessage().contains("at least 32 characters"));
    }

    @Test
    void init_Succeeds_WhenSecretIsExactly32Chars() throws Exception {
        JwtService service = new JwtService();
        setField(service, "secretKey", "12345678901234567890123456789012"); // exactly 32
        setField(service, "jwtExpiration", EXPIRATION_MS);

        assertDoesNotThrow(service::init);
    }

    // ── generateToken ─────────────────────────────────────────────────────

    @Test
    void generateToken_ReturnsNonNullToken() {
        String token = jwtService.generateToken("johndoe");

        assertNotNull(token);
        assertFalse(token.isBlank());
    }

    @Test
    void generateToken_TokenContainsCorrectUsername() {
        String token = jwtService.generateToken("johndoe");

        assertEquals("johndoe", jwtService.extractUsername(token));
    }

    @Test
    void generateToken_TokenContainsJti() {
        String token = jwtService.generateToken("johndoe");

        String jti = jwtService.extractTokenId(token);
        assertNotNull(jti);
        assertDoesNotThrow(() -> java.util.UUID.fromString(jti));
    }

    @Test
    void generateToken_EachTokenHasUniqueJti() {
        String token1 = jwtService.generateToken("johndoe");
        String token2 = jwtService.generateToken("johndoe");

        assertNotEquals(jwtService.extractTokenId(token1), jwtService.extractTokenId(token2));
    }

    @Test
    void generateToken_DifferentUsersProduceDifferentTokens() {
        String token1 = jwtService.generateToken("alice");
        String token2 = jwtService.generateToken("bob");

        assertNotEquals(token1, token2);
        assertEquals("alice", jwtService.extractUsername(token1));
        assertEquals("bob", jwtService.extractUsername(token2));
    }

    // ── extractUsername ────────────────────────────────────────────────────

    @Test
    void extractUsername_ReturnsCorrectUsername() {
        String token = jwtService.generateToken("testuser");

        assertEquals("testuser", jwtService.extractUsername(token));
    }

    // ── isTokenValid ──────────────────────────────────────────────────────

    @Test
    void isTokenValid_ReturnsTrue_WhenUsernameMatchesAndNotExpired() {
        String token = jwtService.generateToken("johndoe");

        assertTrue(jwtService.isTokenValid(token, "johndoe"));
    }

    @Test
    void isTokenValid_ReturnsFalse_WhenUsernameDoesNotMatch() {
        String token = jwtService.generateToken("johndoe");

        assertFalse(jwtService.isTokenValid(token, "janedoe"));
    }

    @Test
    void isTokenValid_ThrowsExpiredJwtException_WhenTokenIsExpired() throws Exception {
        // Create a service with 0ms expiration
        JwtService expiredService = new JwtService();
        setField(expiredService, "secretKey", VALID_SECRET);
        setField(expiredService, "jwtExpiration", 0L);
        expiredService.init();

        String token = expiredService.generateToken("johndoe");

        // JJWT throws ExpiredJwtException during parsing — the filter layer handles this
        assertThrows(Exception.class, () -> jwtService.isTokenValid(token, "johndoe"));
    }

    @Test
    void isTokenValid_ThrowsException_WhenTokenIsTampered() {
        String token = jwtService.generateToken("johndoe");
        String tampered = token.substring(0, token.length() - 5) + "XXXXX";

        assertThrows(Exception.class, () -> jwtService.isTokenValid(tampered, "johndoe"));
    }

    @Test
    void isTokenValid_ThrowsException_WhenSignedWithDifferentKey() throws Exception {
        JwtService otherService = new JwtService();
        setField(otherService, "secretKey", "a-completely-different-secret-key-that-is-long-enough");
        setField(otherService, "jwtExpiration", EXPIRATION_MS);
        otherService.init();

        String tokenFromOtherKey = otherService.generateToken("johndoe");

        // This service should reject a token signed with a different key
        assertThrows(Exception.class, () -> jwtService.isTokenValid(tokenFromOtherKey, "johndoe"));
    }

    // ── getJwtExpiration ──────────────────────────────────────────────────

    @Test
    void getJwtExpiration_ReturnsConfiguredValue() {
        assertEquals(EXPIRATION_MS, jwtService.getJwtExpiration());
    }
}
