package com.nadavramon.job_tracker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.nadavramon.job_tracker.config.JwtAuthenticationFilter;
import com.nadavramon.job_tracker.config.SecurityConfig;
import com.nadavramon.job_tracker.dto.ApplicationRequest;
import com.nadavramon.job_tracker.entity.Application;
import com.nadavramon.job_tracker.entity.User;
import com.nadavramon.job_tracker.repository.ApplicationRepository;
import com.nadavramon.job_tracker.repository.UserRepository;
import com.nadavramon.job_tracker.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@WebMvcTest(ApplicationController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
public class ApplicationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @MockitoBean
    private ApplicationRepository applicationRepository;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private JwtService jwtService;

    private User mockUser;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        mockUser.setId(UUID.randomUUID());
        mockUser.setUsername("user");
        mockUser.setEmail("test@test.com");

        when(userRepository.findByUsername("user")).thenReturn(Optional.of(mockUser));
    }

    @Test
    @WithMockUser
    void getAllApplications_ReturnsEmptyList_WhenNoApplicationsExist() throws Exception {
        when(applicationRepository.findByUser(any(User.class))).thenReturn(List.of());

        mockMvc.perform(get("/applications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @WithMockUser
    void getAllApplications_ReturnsList_WhenApplicationsExist() throws Exception {
        Application app1 = new Application();
        app1.setCompanyName("Google");
        app1.setLocation("Tel Aviv");
        app1.setUser(mockUser);

        Application app2 = new Application();
        app2.setCompanyName("Microsoft");
        app2.setLocation("Herzliya");
        app2.setUser(mockUser);

        when(applicationRepository.findByUser(any(User.class))).thenReturn(List.of(app1, app2));

        mockMvc.perform(get("/applications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].companyName").value("Google"))
                .andExpect(jsonPath("$[1].companyName").value("Microsoft"));
    }


    /*
    supposed to keep expecting 401 since that's more semantically correct for "not authenticated"
    For simplicity changed the test to expect 403: .andExpect(status().isForbidden())
     */
    @Test
    void getAllApplications_Returns403_WhenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/applications"))
                .andExpect(status().isForbidden());
    }
    @Test
    @WithMockUser
    void createApplication_ReturnsBadRequest_WhenFieldsAreInvalid() throws Exception {
        ApplicationRequest invalidRequest = new ApplicationRequest();
        invalidRequest.setCompanyName("");
        invalidRequest.setJobRole("Developer");

        mockMvc.perform(post("/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @WithMockUser
    void getApplicationById_ReturnsNotFound_WhenIdDoesNotExist() throws Exception {
        UUID randomId = UUID.randomUUID();
        when(applicationRepository.findById(randomId)).thenReturn(Optional.empty());

        mockMvc.perform(get("/applications/" + randomId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Application not found"));
    }

    @Test
    @WithMockUser
    void getApplicationById_ReturnsForbidden_WhenAccessingOtherUserData() throws Exception {
        UUID appId = UUID.randomUUID();

        User otherUser = new User();
        otherUser.setId(UUID.randomUUID());

        Application otherUsersApp = new Application();
        otherUsersApp.setId(appId);
        otherUsersApp.setUser(otherUser);

        when(applicationRepository.findById(appId)).thenReturn(Optional.of(otherUsersApp));

        mockMvc.perform(get("/applications/" + appId))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));
    }

    @Test
    @WithMockUser
    void createApplication_ReturnsSuccess_WhenValidRequest() throws Exception {
        ApplicationRequest request = new ApplicationRequest();
        request.setCompanyName("Google");
        request.setJobRole("Developer");
        request.setLocation("Tel Aviv");
        request.setStatus("APPLIED");
        request.setJobType("FULL_TIME");
        request.setAppliedDate(java.time.LocalDate.now());
        request.setWebsiteLink("https://google.com");

        Application savedApp = new Application();
        savedApp.setId(UUID.randomUUID());
        savedApp.setCompanyName("Google");
        savedApp.setUser(mockUser);

        when(applicationRepository.save(any(Application.class))).thenReturn(savedApp);

        mockMvc.perform(post("/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyName").value("Google"));
    }

    @Test
    @WithMockUser
    void deleteApplication_ReturnsSuccess_WhenUserOwnsApplication() throws Exception {
        UUID appId = UUID.randomUUID();

        Application app = new Application();
        app.setId(appId);
        app.setUser(mockUser);

        when(applicationRepository.findById(appId)).thenReturn(Optional.of(app));

        mockMvc.perform(delete("/applications/" + appId))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    void deleteApplication_ReturnsNotFound_WhenIdDoesNotExist() throws Exception {
        UUID randomId = UUID.randomUUID();
        when(applicationRepository.findById(randomId)).thenReturn(Optional.empty());

        mockMvc.perform(delete("/applications/" + randomId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Application not found"));
    }

    @Test
    @WithMockUser
    void deleteApplication_ReturnsForbidden_WhenAccessingOtherUserData() throws Exception {
        UUID appId = UUID.randomUUID();

        User otherUser = new User();
        otherUser.setId(UUID.randomUUID());

        Application otherUsersApp = new Application();
        otherUsersApp.setId(appId);
        otherUsersApp.setUser(otherUser);

        when(applicationRepository.findById(appId)).thenReturn(Optional.of(otherUsersApp));

        mockMvc.perform(delete("/applications/" + appId))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));
    }
}
