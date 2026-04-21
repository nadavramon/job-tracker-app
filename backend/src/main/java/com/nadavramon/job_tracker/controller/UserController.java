package com.nadavramon.job_tracker.controller;

import com.nadavramon.job_tracker.dto.UpdateProfileRequest;
import com.nadavramon.job_tracker.dto.UserProfileResponse;
import com.nadavramon.job_tracker.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/me")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public UserProfileResponse getProfile() {
        return userService.getUserProfile();
    }

    @PatchMapping
    public UserProfileResponse updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateUserProfile(request);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAccount() {
        userService.deleteCurrentUser();
    }
}
