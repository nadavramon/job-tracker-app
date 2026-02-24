package com.nadavramon.job_tracker.service;

import com.nadavramon.job_tracker.dto.UpdateProfileRequest;
import com.nadavramon.job_tracker.dto.UserProfileResponse;
import com.nadavramon.job_tracker.entity.User;
import com.nadavramon.job_tracker.exception.DuplicateResourceException;
import com.nadavramon.job_tracker.exception.ResourceNotFoundException;
import com.nadavramon.job_tracker.repository.ApplicationRepository;
import com.nadavramon.job_tracker.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, ApplicationRepository applicationRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserProfileResponse getUserProfile() {
        return toResponse(getCurrentUser());
    }

    public UserProfileResponse updateUserProfile(UpdateProfileRequest request) {
        User user = getCurrentUser();

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail()))
                throw new DuplicateResourceException("Email already taken");
            user.setEmail(request.getEmail());
        }

        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.getUsername()))
                throw new DuplicateResourceException("Username already taken");
            user.setUsername(request.getUsername());
        }

        if (request.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getThemePreference() != null) {
            user.setThemePreference(request.getThemePreference());
        }

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void deleteCurrentUser() {
        User user = getCurrentUser();
        LocalDateTime now = LocalDateTime.now();
        applicationRepository.softDeleteAllByUser(user, now);
        user.setDeletedAt(now);
        userRepository.save(user);
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private UserProfileResponse toResponse(User user) {
        return new UserProfileResponse(user.getId(), user.getEmail(), user.getUsername(),
                user.getThemePreference());
    }
}
