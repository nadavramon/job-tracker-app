package com.nadavramon.job_tracker.service;

import com.nadavramon.job_tracker.dto.AuthResponse;
import com.nadavramon.job_tracker.dto.LoginRequest;
import com.nadavramon.job_tracker.dto.RegisterRequest;
import com.nadavramon.job_tracker.entity.User;
import com.nadavramon.job_tracker.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;


    public AuthService(UserRepository userRepository, JwtService jwtService, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse register(RegisterRequest request) {
        User user = new User();
        if (userRepository.existsByEmail(request.getEmail()) ||
                userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("email/password are already taken");
        }
        user.setEmail(request.getEmail());
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);

        return new AuthResponse(jwtService.generateToken(user.getUsername()), user.getUsername());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("error message: Invalid email"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword()))
            throw new RuntimeException("Invalid credentials");

        return new AuthResponse(jwtService.generateToken(user.getUsername()), user.getUsername());
    }
}
