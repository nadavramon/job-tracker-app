package com.nadavramon.job_tracker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.nadavramon.job_tracker.config.JwtAuthenticationFilter;
import com.nadavramon.job_tracker.config.SecurityConfig;
import com.nadavramon.job_tracker.dto.ApplicationRequest;
import com.nadavramon.job_tracker.dto.ApplicationResponse;
import com.nadavramon.job_tracker.enums.JobType;
import com.nadavramon.job_tracker.enums.Status;
import com.nadavramon.job_tracker.exception.AccessDeniedException;
import com.nadavramon.job_tracker.exception.ResourceNotFoundException;
import com.nadavramon.job_tracker.service.ApplicationService;
import com.nadavramon.job_tracker.service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
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
    private ApplicationService applicationService;

    @MockitoBean
    private JwtService jwtService;

    @Test
    @WithMockUser
    void getAllApplications_ReturnsEmptyList_WhenNoApplicationsExist() throws Exception {
        when(applicationService.getAllApplicationsByUser()).thenReturn(List.of());

        mockMvc.perform(get("/applications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @WithMockUser
    void getAllApplications_ReturnsList_WhenApplicationsExist() throws Exception {
        ApplicationResponse app1 = new ApplicationResponse(
                UUID.randomUUID(), "Google", JobType.FULL_TIME, "Tel Aviv", "Developer",
                LocalDate.now(), Status.APPLIED, null, "https://google.com", null, null
        );
        ApplicationResponse app2 = new ApplicationResponse(
                UUID.randomUUID(), "Microsoft", JobType.FULL_TIME, "Herzliya", "Engineer",
                LocalDate.now(), Status.APPLIED, null, "https://microsoft.com", null, null
        );

        when(applicationService.getAllApplicationsByUser()).thenReturn(List.of(app1, app2));

        mockMvc.perform(get("/applications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].companyName").value("Google"))
                .andExpect(jsonPath("$[1].companyName").value("Microsoft"));
    }

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
        when(applicationService.getApplicationByUser(randomId))
                .thenThrow(new ResourceNotFoundException("Application not found"));

        mockMvc.perform(get("/applications/" + randomId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Application not found"));
    }

    @Test
    @WithMockUser
    void getApplicationById_ReturnsForbidden_WhenAccessingOtherUserData() throws Exception {
        UUID appId = UUID.randomUUID();
        when(applicationService.getApplicationByUser(appId))
                .thenThrow(new AccessDeniedException("Access denied"));

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
        request.setStatus(Status.APPLIED);
        request.setJobType(JobType.FULL_TIME);
        request.setAppliedDate(LocalDate.now());
        request.setWebsiteLink("https://google.com");

        ApplicationResponse response = new ApplicationResponse(
                UUID.randomUUID(), "Google", JobType.FULL_TIME, "Tel Aviv", "Developer",
                LocalDate.now(), Status.APPLIED, null, "https://google.com", null, null
        );

        when(applicationService.createApplicationByUser(any(ApplicationRequest.class))).thenReturn(response);

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
        doNothing().when(applicationService).deleteApplicationByUser(appId);

        mockMvc.perform(delete("/applications/" + appId))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    void deleteApplication_ReturnsNotFound_WhenIdDoesNotExist() throws Exception {
        UUID randomId = UUID.randomUUID();
        doThrow(new ResourceNotFoundException("Application not found"))
                .when(applicationService).deleteApplicationByUser(randomId);

        mockMvc.perform(delete("/applications/" + randomId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Application not found"));
    }

    @Test
    @WithMockUser
    void deleteApplication_ReturnsForbidden_WhenAccessingOtherUserData() throws Exception {
        UUID appId = UUID.randomUUID();
        doThrow(new AccessDeniedException("Access denied"))
                .when(applicationService).deleteApplicationByUser(appId);

        mockMvc.perform(delete("/applications/" + appId))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));
    }
}