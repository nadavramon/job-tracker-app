package com.nadavramon.job_tracker.service;

import com.nadavramon.job_tracker.dto.LoginRequest;
import com.nadavramon.job_tracker.dto.RegisterRequest;
import com.nadavramon.job_tracker.entity.User;
import com.nadavramon.job_tracker.exception.DuplicateResourceException;
import com.nadavramon.job_tracker.exception.InvalidCredentialsException;
import com.nadavramon.job_tracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder);
    }

    private RegisterRequest makeRegisterRequest(String email, String username, String password) {
        RegisterRequest request = new RegisterRequest();
        request.setEmail(email);
        request.setUsername(username);
        request.setPassword(password);
        return request;
    }

    private LoginRequest makeLoginRequest(String identifier, String password) {
        LoginRequest request = new LoginRequest();
        request.setIdentifier(identifier);
        request.setPassword(password);
        return request;
    }

    private User makeUser(String email, String username, String encodedPassword) {
        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPassword(encodedPassword);
        return user;
    }

    // ── register ──────────────────────────────────────────────────────────

    @Test
    void register_Success_WhenEmailAndUsernameAreNew() {
        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(userRepository.existsByUsername("johndoe")).thenReturn(false);
        when(passwordEncoder.encode("password1")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = authService.register(makeRegisterRequest("john@example.com", "johndoe", "password1"));

        assertEquals("john@example.com", result.getEmail());
        assertEquals("johndoe", result.getUsername());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_EncodesPassword_BeforeSaving() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(passwordEncoder.encode("rawPassword")).thenReturn("hashed-value");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        authService.register(makeRegisterRequest("a@b.com", "user1", "rawPassword"));

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertEquals("hashed-value", captor.getValue().getPassword());
    }

    @Test
    void register_NeverStoresRawPassword() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(passwordEncoder.encode("mySecret12")).thenReturn("$2a$encoded");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        authService.register(makeRegisterRequest("a@b.com", "user1", "mySecret12"));

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertNotEquals("mySecret12", captor.getValue().getPassword());
    }

    @Test
    void register_ThrowsDuplicateResource_WhenEmailAlreadyExists() {
        when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                () -> authService.register(makeRegisterRequest("taken@example.com", "newuser", "password1")));

        assertEquals("Email or username already taken", ex.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_ThrowsDuplicateResource_WhenUsernameAlreadyExists() {
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userRepository.existsByUsername("takenuser")).thenReturn(true);

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                () -> authService.register(makeRegisterRequest("new@example.com", "takenuser", "password1")));

        assertEquals("Email or username already taken", ex.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_ThrowsDuplicateResource_WhenBothEmailAndUsernameExist() {
        when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

        assertThrows(DuplicateResourceException.class,
                () -> authService.register(makeRegisterRequest("taken@example.com", "takenuser", "password1")));

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_DoesNotCheckUsername_WhenEmailAlreadyTaken() {
        when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

        assertThrows(DuplicateResourceException.class,
                () -> authService.register(makeRegisterRequest("taken@example.com", "anyuser", "password1")));

        // Short-circuit: username check skipped due to || operator
        verify(userRepository, never()).existsByUsername(anyString());
    }

    // ── login ─────────────────────────────────────────────────────────────

    @Test
    void login_Success_WhenIdentifierIsEmail() {
        User user = makeUser("john@example.com", "johndoe", "encoded");
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password1", "encoded")).thenReturn(true);

        User result = authService.login(makeLoginRequest("john@example.com", "password1"));

        assertEquals("johndoe", result.getUsername());
        // Should not fall through to username lookup
        verify(userRepository, never()).findByUsername(anyString());
    }

    @Test
    void login_Success_WhenIdentifierIsUsername() {
        when(userRepository.findByEmail("johndoe")).thenReturn(Optional.empty());
        User user = makeUser("john@example.com", "johndoe", "encoded");
        when(userRepository.findByUsername("johndoe")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password1", "encoded")).thenReturn(true);

        User result = authService.login(makeLoginRequest("johndoe", "password1"));

        assertEquals("john@example.com", result.getEmail());
    }

    @Test
    void login_ThrowsInvalidCredentials_WhenUserNotFoundByEmailOrUsername() {
        when(userRepository.findByEmail("unknown")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        InvalidCredentialsException ex = assertThrows(InvalidCredentialsException.class,
                () -> authService.login(makeLoginRequest("unknown", "password1")));

        assertEquals("Invalid credentials", ex.getMessage());
    }

    @Test
    void login_ThrowsInvalidCredentials_WhenPasswordIsWrong() {
        User user = makeUser("john@example.com", "johndoe", "encoded");
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpass1", "encoded")).thenReturn(false);

        InvalidCredentialsException ex = assertThrows(InvalidCredentialsException.class,
                () -> authService.login(makeLoginRequest("john@example.com", "wrongpass1")));

        assertEquals("Invalid credentials", ex.getMessage());
    }

    @Test
    void login_SameErrorMessage_ForWrongUserAndWrongPassword() {
        // Wrong user
        when(userRepository.findByEmail("noone")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("noone")).thenReturn(Optional.empty());
        InvalidCredentialsException ex1 = assertThrows(InvalidCredentialsException.class,
                () -> authService.login(makeLoginRequest("noone", "password1")));

        // Wrong password
        User user = makeUser("john@example.com", "johndoe", "encoded");
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("badpass12", "encoded")).thenReturn(false);
        InvalidCredentialsException ex2 = assertThrows(InvalidCredentialsException.class,
                () -> authService.login(makeLoginRequest("john@example.com", "badpass12")));

        // Both return the same generic message — no user enumeration
        assertEquals(ex1.getMessage(), ex2.getMessage());
    }

    // ── findByUsername ─────────────────────────────────────────────────────

    @Test
    void findByUsername_ReturnsUser_WhenExists() {
        User user = makeUser("john@example.com", "johndoe", "encoded");
        when(userRepository.findByUsername("johndoe")).thenReturn(Optional.of(user));

        User result = authService.findByUsername("johndoe");

        assertNotNull(result);
        assertEquals("johndoe", result.getUsername());
    }

    @Test
    void findByUsername_ReturnsNull_WhenNotFound() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        User result = authService.findByUsername("ghost");

        assertNull(result);
    }
}
