package com.nadavramon.job_tracker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nadavramon.job_tracker.config.JwtAuthenticationFilter;
import com.nadavramon.job_tracker.config.SecurityConfig;
import com.nadavramon.job_tracker.dto.UpdateProfileRequest;
import com.nadavramon.job_tracker.dto.UserProfileResponse;
import com.nadavramon.job_tracker.enums.ThemePreference;
import com.nadavramon.job_tracker.exception.DuplicateResourceException;
import com.nadavramon.job_tracker.service.JwtService;
import com.nadavramon.job_tracker.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private JwtService jwtService;

    @Test
    @WithMockUser
    void getProfile_ReturnsProfile_WhenAuthenticated() throws Exception {
        UserProfileResponse profile = new UserProfileResponse(
                UUID.randomUUID(), "test@test.com", "testuser", ThemePreference.SYSTEM
        );
        when(userService.getUserProfile()).thenReturn(profile);

        mockMvc.perform(get("/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@test.com"))
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.themePreference").value("SYSTEM"));
    }

    @Test
    void getProfile_Returns403_WhenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser
    void updateProfile_ReturnsUpdatedProfile_WhenValidRequest() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setThemePreference(ThemePreference.DARK);

        UserProfileResponse updated = new UserProfileResponse(
                UUID.randomUUID(), "test@test.com", "testuser", ThemePreference.DARK
        );
        when(userService.updateUserProfile(any(UpdateProfileRequest.class))).thenReturn(updated);

        mockMvc.perform(patch("/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.themePreference").value("DARK"));
    }

    @Test
    @WithMockUser
    void updateProfile_ReturnsBadRequest_WhenEmailInvalid() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setEmail("not-an-email");

        mockMvc.perform(patch("/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @WithMockUser
    void updateProfile_ReturnsBadRequest_WhenPasswordTooShort() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setPassword("short");

        mockMvc.perform(patch("/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @WithMockUser
    void updateProfile_ReturnsConflict_WhenEmailAlreadyTaken() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setEmail("taken@test.com");

        when(userService.updateUserProfile(any(UpdateProfileRequest.class)))
                .thenThrow(new DuplicateResourceException("Email already taken"));

        mockMvc.perform(patch("/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email already taken"));
    }

    @Test
    @WithMockUser
    void deleteAccount_ReturnsSuccess_WhenAuthenticated() throws Exception {
        doNothing().when(userService).deleteCurrentUser();

        mockMvc.perform(delete("/me"))
                .andExpect(status().isOk());
    }

    @Test
    void deleteAccount_Returns403_WhenNotAuthenticated() throws Exception {
        mockMvc.perform(delete("/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser
    void updateProfile_ReturnsConflict_WhenUsernameAlreadyTaken() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setUsername("takenuser");

        when(userService.updateUserProfile(any(UpdateProfileRequest.class)))
                .thenThrow(new DuplicateResourceException("Username already taken"));

        mockMvc.perform(patch("/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Username already taken"));
    }

    @Test
    @WithMockUser
    void updateProfile_ReturnsBadRequest_WhenUsernameTooShort() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setUsername("ab");

        mockMvc.perform(patch("/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }
}
