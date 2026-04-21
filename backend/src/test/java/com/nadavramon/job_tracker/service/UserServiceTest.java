package com.nadavramon.job_tracker.service;

import com.nadavramon.job_tracker.dto.UpdateProfileRequest;
import com.nadavramon.job_tracker.dto.UserProfileResponse;
import com.nadavramon.job_tracker.entity.User;
import com.nadavramon.job_tracker.enums.ThemePreference;
import com.nadavramon.job_tracker.exception.DuplicateResourceException;
import com.nadavramon.job_tracker.exception.InvalidCredentialsException;
import com.nadavramon.job_tracker.repository.ApplicationRepository;
import com.nadavramon.job_tracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EncryptionService encryptionService;

    private UserService userService;

    private User currentUser;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, applicationRepository,
                currentUserService, refreshTokenService, passwordEncoder, encryptionService);

        currentUser = new User();
        currentUser.setId(UUID.randomUUID());
        currentUser.setEmail("john@example.com");
        currentUser.setUsername("johndoe");
        currentUser.setPassword("encoded-old-password");
        currentUser.setThemePreference(ThemePreference.SYSTEM);
        currentUser.setAnthropicApiKey(null);

        when(currentUserService.getCurrentUser()).thenReturn(currentUser);
    }

    private UpdateProfileRequest makeUpdateRequest() {
        return new UpdateProfileRequest();
    }

    // ── getUserProfile ────────────────────────────────────────────────────

    @Test
    void getUserProfile_ReturnsCorrectFields() {
        UserProfileResponse response = userService.getUserProfile();

        assertEquals(currentUser.getId(), response.getId());
        assertEquals("john@example.com", response.getEmail());
        assertEquals("johndoe", response.getUsername());
        assertEquals(ThemePreference.SYSTEM, response.getThemePreference());
    }

    @Test
    void getUserProfile_HasApiKeyIsFalse_WhenNoApiKeyStored() {
        UserProfileResponse response = userService.getUserProfile();

        assertFalse(response.isHasApiKey());
    }

    @Test
    void getUserProfile_HasApiKeyIsTrue_WhenApiKeyIsSet() {
        currentUser.setAnthropicApiKey("encrypted-key");

        UserProfileResponse response = userService.getUserProfile();

        assertTrue(response.isHasApiKey());
    }

    // ── updateUserProfile — email ─────────────────────────────────────────

    @Test
    void updateProfile_UpdatesEmail_WhenNewEmailProvided() {
        UpdateProfileRequest request = makeUpdateRequest();
        request.setEmail("new@example.com");
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserProfileResponse response = userService.updateUserProfile(request);

        assertEquals("new@example.com", response.getEmail());
    }

    @Test
    void updateProfile_ThrowsDuplicate_WhenEmailAlreadyTaken() {
        UpdateProfileRequest request = makeUpdateRequest();
        request.setEmail("taken@example.com");
        when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

        assertThrows(DuplicateResourceException.class,
                () -> userService.updateUserProfile(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void updateProfile_SkipsEmailUpdate_WhenSameAsCurrent() {
        UpdateProfileRequest request = makeUpdateRequest();
        request.setEmail("john@example.com"); // same as current
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.updateUserProfile(request);

        // Should not check for duplicates since email didn't change
        verify(userRepository, never()).existsByEmail(anyString());
    }

    // ── updateUserProfile — password ──────────────────────────────────────

    @Test
    void updateProfile_UpdatesPassword_WhenCurrentPasswordIsCorrect() {
        UpdateProfileRequest request = makeUpdateRequest();
        request.setCurrentPassword("oldpass12");
        request.setPassword("newpass12");
        when(passwordEncoder.matches("oldpass12", "encoded-old-password")).thenReturn(true);
        when(passwordEncoder.encode("newpass12")).thenReturn("encoded-new-password");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.updateUserProfile(request);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertEquals("encoded-new-password", captor.getValue().getPassword());
    }

    @Test
    void updateProfile_ThrowsInvalidCredentials_WhenCurrentPasswordIsWrong() {
        UpdateProfileRequest request = makeUpdateRequest();
        request.setCurrentPassword("wrongpass");
        request.setPassword("newpass12");
        when(passwordEncoder.matches("wrongpass", "encoded-old-password")).thenReturn(false);

        InvalidCredentialsException ex = assertThrows(InvalidCredentialsException.class,
                () -> userService.updateUserProfile(request));

        assertEquals("Current password is incorrect", ex.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    void updateProfile_ThrowsInvalidCredentials_WhenCurrentPasswordIsNull() {
        UpdateProfileRequest request = makeUpdateRequest();
        request.setPassword("newpass12");
        // currentPassword left as null

        assertThrows(InvalidCredentialsException.class,
                () -> userService.updateUserProfile(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void updateProfile_EncodesNewPassword_NeverStoresRaw() {
        UpdateProfileRequest request = makeUpdateRequest();
        request.setCurrentPassword("oldpass12");
        request.setPassword("rawNewPwd1");
        when(passwordEncoder.matches("oldpass12", "encoded-old-password")).thenReturn(true);
        when(passwordEncoder.encode("rawNewPwd1")).thenReturn("$2a$hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.updateUserProfile(request);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertNotEquals("rawNewPwd1", captor.getValue().getPassword());
        assertEquals("$2a$hashed", captor.getValue().getPassword());
    }

    // ── updateUserProfile — theme ─────────────────────────────────────────

    @Test
    void updateProfile_UpdatesThemePreference() {
        UpdateProfileRequest request = makeUpdateRequest();
        request.setThemePreference(ThemePreference.DARK);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserProfileResponse response = userService.updateUserProfile(request);

        assertEquals(ThemePreference.DARK, response.getThemePreference());
    }

    // ── updateUserProfile — API key ───────────────────────────────────────

    @Test
    void updateProfile_EncryptsApiKey_BeforeStoring() {
        UpdateProfileRequest request = makeUpdateRequest();
        request.setAnthropicApiKey("sk-ant-key123");
        when(encryptionService.encrypt("sk-ant-key123")).thenReturn("encrypted-key");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.updateUserProfile(request);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertEquals("encrypted-key", captor.getValue().getAnthropicApiKey());
    }

    @Test
    void updateProfile_ClearsApiKey_WhenEmptyStringProvided() {
        currentUser.setAnthropicApiKey("encrypted-old-key");
        UpdateProfileRequest request = makeUpdateRequest();
        request.setAnthropicApiKey("");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.updateUserProfile(request);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertNull(captor.getValue().getAnthropicApiKey());
    }

    @Test
    void updateProfile_DoesNotTouchApiKey_WhenFieldIsNull() {
        currentUser.setAnthropicApiKey("existing-encrypted");
        UpdateProfileRequest request = makeUpdateRequest();
        // anthropicApiKey left as null
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.updateUserProfile(request);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertEquals("existing-encrypted", captor.getValue().getAnthropicApiKey());
        verify(encryptionService, never()).encrypt(anyString());
    }

    // ── updateUserProfile — partial updates ───────────────────────────────

    @Test
    void updateProfile_IgnoresNullFields() {
        UpdateProfileRequest request = makeUpdateRequest();
        // All fields null — should still save without changes
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserProfileResponse response = userService.updateUserProfile(request);

        assertEquals("john@example.com", response.getEmail());
        assertEquals("johndoe", response.getUsername());
        verify(userRepository, never()).existsByEmail(anyString());
        verify(passwordEncoder, never()).encode(anyString());
        verify(encryptionService, never()).encrypt(anyString());
    }

    @Test
    void updateProfile_UpdatesMultipleFields_AtOnce() {
        UpdateProfileRequest request = makeUpdateRequest();
        request.setEmail("new@example.com");
        request.setThemePreference(ThemePreference.LIGHT);
        request.setAnthropicApiKey("sk-new-key");
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(encryptionService.encrypt("sk-new-key")).thenReturn("encrypted-new");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserProfileResponse response = userService.updateUserProfile(request);

        assertEquals("new@example.com", response.getEmail());
        assertEquals(ThemePreference.LIGHT, response.getThemePreference());
        assertTrue(response.isHasApiKey());
    }

    // ── getUserApiKey ─────────────────────────────────────────────────────

    @Test
    void getUserApiKey_ReturnsDecryptedKey_WhenSet() {
        currentUser.setAnthropicApiKey("encrypted-key");
        when(encryptionService.decrypt("encrypted-key")).thenReturn("sk-ant-plaintext");

        String result = userService.getUserApiKey();

        assertEquals("sk-ant-plaintext", result);
    }

    @Test
    void getUserApiKey_ReturnsNull_WhenNoKeyStored() {
        String result = userService.getUserApiKey();

        assertNull(result);
        verify(encryptionService, never()).decrypt(anyString());
    }

    // ── deleteCurrentUser ─────────────────────────────────────────────────

    @Test
    void deleteUser_RevokesAllRefreshTokens() {
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.deleteCurrentUser();

        verify(refreshTokenService).revokeAllUserTokens(currentUser);
    }

    @Test
    void deleteUser_SoftDeletesAllApplications() {
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.deleteCurrentUser();

        verify(applicationRepository).softDeleteAllByUser(eq(currentUser), any());
    }

    @Test
    void deleteUser_ManglesEmailAndUsername() {
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.deleteCurrentUser();

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();

        assertTrue(saved.getEmail().startsWith("john@example.com_deleted_"));
        assertTrue(saved.getUsername().startsWith("johndoe_deleted_"));
    }

    @Test
    void deleteUser_SetsDeletedAt() {
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.deleteCurrentUser();

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertNotNull(captor.getValue().getDeletedAt());
    }

    @Test
    void deleteUser_PerformsAllOperationsInOrder() {
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.deleteCurrentUser();

        verify(refreshTokenService).revokeAllUserTokens(currentUser);
        verify(applicationRepository).softDeleteAllByUser(eq(currentUser), any());
        verify(userRepository).save(currentUser);
    }
}
