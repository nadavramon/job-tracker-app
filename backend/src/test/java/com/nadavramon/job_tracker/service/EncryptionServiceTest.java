package com.nadavramon.job_tracker.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.*;

public class EncryptionServiceTest {

    private EncryptionService encryptionService;

    private static final String VALID_SECRET = "my-super-secret-encryption-key-for-testing";

    @BeforeEach
    void setUp() throws Exception {
        encryptionService = new EncryptionService();
        setField(encryptionService, "encryptionSecret", VALID_SECRET);
        encryptionService.validateSecret();
    }

    private void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    // ── validateSecret (@PostConstruct) ───────────────────────────────────

    @Test
    void validateSecret_ThrowsIllegalState_WhenSecretIsNull() throws Exception {
        EncryptionService service = new EncryptionService();
        setField(service, "encryptionSecret", null);

        assertThrows(IllegalStateException.class, service::validateSecret);
    }

    @Test
    void validateSecret_ThrowsIllegalState_WhenSecretIsEmpty() throws Exception {
        EncryptionService service = new EncryptionService();
        setField(service, "encryptionSecret", "");

        assertThrows(IllegalStateException.class, service::validateSecret);
    }

    @Test
    void validateSecret_ThrowsIllegalState_WhenSecretIsBlank() throws Exception {
        EncryptionService service = new EncryptionService();
        setField(service, "encryptionSecret", "   ");

        IllegalStateException ex = assertThrows(IllegalStateException.class, service::validateSecret);
        assertTrue(ex.getMessage().contains("must not be empty"));
    }

    @Test
    void validateSecret_Succeeds_WhenSecretIsSet() throws Exception {
        EncryptionService service = new EncryptionService();
        setField(service, "encryptionSecret", "valid-secret");

        assertDoesNotThrow(service::validateSecret);
    }

    // ── encrypt/decrypt round-trip ────────────────────────────────────────

    @Test
    void encryptDecrypt_RoundTrip_ReturnsOriginalPlaintext() {
        String plaintext = "my-portal-password";

        String encrypted = encryptionService.encrypt(plaintext);
        String decrypted = encryptionService.decrypt(encrypted);

        assertEquals(plaintext, decrypted);
    }

    @Test
    void encryptDecrypt_RoundTrip_WorksWithEmptyString() {
        String encrypted = encryptionService.encrypt("");
        String decrypted = encryptionService.decrypt(encrypted);

        assertEquals("", decrypted);
    }

    @Test
    void encryptDecrypt_RoundTrip_WorksWithUnicodeCharacters() {
        String plaintext = "пароль 密码 パスワード 🔐";

        String encrypted = encryptionService.encrypt(plaintext);
        String decrypted = encryptionService.decrypt(encrypted);

        assertEquals(plaintext, decrypted);
    }

    @Test
    void encryptDecrypt_RoundTrip_WorksWithLongInput() {
        String plaintext = "a".repeat(10_000);

        String encrypted = encryptionService.encrypt(plaintext);
        String decrypted = encryptionService.decrypt(encrypted);

        assertEquals(plaintext, decrypted);
    }

    @Test
    void encryptDecrypt_RoundTrip_WorksWithSpecialCharacters() {
        String plaintext = "p@$$w0rd!#%^&*(){}[]|\\:\";<>?,./~`";

        String encrypted = encryptionService.encrypt(plaintext);
        String decrypted = encryptionService.decrypt(encrypted);

        assertEquals(plaintext, decrypted);
    }

    // ── encrypt ───────────────────────────────────────────────────────────

    @Test
    void encrypt_ReturnsNull_WhenPlaintextIsNull() {
        assertNull(encryptionService.encrypt(null));
    }

    @Test
    void encrypt_ReturnsColonSeparatedFormat() {
        String encrypted = encryptionService.encrypt("test");

        // Format: base64(iv):base64(ciphertext+tag)
        String[] parts = encrypted.split(":");
        assertEquals(2, parts.length);
        assertFalse(parts[0].isEmpty());
        assertFalse(parts[1].isEmpty());
    }

    @Test
    void encrypt_ProducesDifferentOutputForSameInput() {
        // Due to random IV, same plaintext should produce different ciphertext
        String encrypted1 = encryptionService.encrypt("same-input");
        String encrypted2 = encryptionService.encrypt("same-input");

        assertNotEquals(encrypted1, encrypted2);
    }

    @Test
    void encrypt_OutputIsNotPlaintext() {
        String plaintext = "visible-password";
        String encrypted = encryptionService.encrypt(plaintext);

        assertNotEquals(plaintext, encrypted);
        assertFalse(encrypted.contains(plaintext));
    }

    // ── decrypt ───────────────────────────────────────────────────────────

    @Test
    void decrypt_ReturnsNull_WhenInputIsNull() {
        assertNull(encryptionService.decrypt(null));
    }

    @Test
    void decrypt_ThrowsRuntimeException_WhenFormatIsInvalid() {
        assertThrows(RuntimeException.class,
                () -> encryptionService.decrypt("not-a-valid-encrypted-value"));
    }

    @Test
    void decrypt_ThrowsRuntimeException_WhenCiphertextIsTampered() {
        String encrypted = encryptionService.encrypt("original");
        String[] parts = encrypted.split(":");
        // Tamper with ciphertext
        String tampered = parts[0] + ":" + parts[1].substring(0, parts[1].length() - 4) + "XXXX";

        assertThrows(RuntimeException.class,
                () -> encryptionService.decrypt(tampered));
    }

    @Test
    void decrypt_ThrowsRuntimeException_WhenIvIsTampered() {
        String encrypted = encryptionService.encrypt("original");
        String[] parts = encrypted.split(":");
        // Tamper with IV
        String tampered = "AAAAAAAAAAAAAAAA:" + parts[1];

        assertThrows(RuntimeException.class,
                () -> encryptionService.decrypt(tampered));
    }

    @Test
    void decrypt_FailsWithDifferentSecret() throws Exception {
        String encrypted = encryptionService.encrypt("secret-data");

        EncryptionService otherService = new EncryptionService();
        setField(otherService, "encryptionSecret", "a-completely-different-secret-key");
        otherService.validateSecret();

        assertThrows(RuntimeException.class,
                () -> otherService.decrypt(encrypted));
    }
}
