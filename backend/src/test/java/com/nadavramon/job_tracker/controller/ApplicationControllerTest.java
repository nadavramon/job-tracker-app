package com.nadavramon.job_tracker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.nadavramon.job_tracker.config.JwtAuthenticationFilter;
import com.nadavramon.job_tracker.config.RateLimitFilter;
import com.nadavramon.job_tracker.config.SecurityConfig;
import com.nadavramon.job_tracker.dto.ApplicationRequest;
import com.nadavramon.job_tracker.dto.ApplicationResponse;
import com.nadavramon.job_tracker.dto.ApplicationStatsResponse;
import com.nadavramon.job_tracker.dto.CredentialsResponse;
import com.nadavramon.job_tracker.dto.MonthlyCount;
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

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@WebMvcTest(ApplicationController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, RateLimitFilter.class})
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
    void getAllApplications_ReturnsEmptyPage_WhenNoApplicationsExist() throws Exception {
        when(applicationService.getAllApplicationsByUser(any(), any(), any(Pageable.class)))
                .thenReturn(Page.empty());

        mockMvc.perform(get("/applications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content").isEmpty());
    }

    @Test
    @WithMockUser
    void getAllApplications_ReturnsPage_WhenApplicationsExist() throws Exception {
        ApplicationResponse app1 = new ApplicationResponse(
                UUID.randomUUID(), "Google", JobType.FULL_TIME, "Tel Aviv", "Developer",
                LocalDate.now(), Status.APPLIED, null, "https://google.com", null
        );
        ApplicationResponse app2 = new ApplicationResponse(
                UUID.randomUUID(), "Microsoft", JobType.FULL_TIME, "Herzliya", "Engineer",
                LocalDate.now(), Status.APPLIED, null, "https://microsoft.com", null
        );

        when(applicationService.getAllApplicationsByUser(any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(app1, app2)));

        mockMvc.perform(get("/applications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].companyName").value("Google"))
                .andExpect(jsonPath("$.content[1].companyName").value("Microsoft"));
    }

    @Test
    void getAllApplications_Returns401_WhenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/applications"))
                .andExpect(status().isUnauthorized());
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
                LocalDate.now(), Status.APPLIED, null, "https://google.com", null
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

    @Test
    @WithMockUser
    void getStats_ReturnsStats_WhenAuthenticated() throws Exception {
        Map<Status, Long> breakdown = new EnumMap<>(Status.class);
        for (Status s : Status.values()) breakdown.put(s, 0L);
        breakdown.put(Status.APPLIED, 3L);
        breakdown.put(Status.REJECTED, 1L);

        List<MonthlyCount> monthly = List.of(new MonthlyCount("2026-02", 4L));
        ApplicationStatsResponse stats = new ApplicationStatsResponse(4, breakdown, monthly, 25.0);

        when(applicationService.getApplicationStats()).thenReturn(stats);

        mockMvc.perform(get("/applications/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalApplications").value(4))
                .andExpect(jsonPath("$.responseRate").value(25.0))
                .andExpect(jsonPath("$.statusBreakdown.APPLIED").value(3))
                .andExpect(jsonPath("$.statusBreakdown.REJECTED").value(1))
                .andExpect(jsonPath("$.monthlyApplications").isArray())
                .andExpect(jsonPath("$.monthlyApplications[0].month").value("2026-02"))
                .andExpect(jsonPath("$.monthlyApplications[0].count").value(4));
    }

    @Test
    @WithMockUser
    void getStats_ReturnsZeroStats_WhenNoApplications() throws Exception {
        Map<Status, Long> breakdown = new EnumMap<>(Status.class);
        for (Status s : Status.values()) breakdown.put(s, 0L);

        ApplicationStatsResponse stats = new ApplicationStatsResponse(0, breakdown, List.of(), 0.0);

        when(applicationService.getApplicationStats()).thenReturn(stats);

        mockMvc.perform(get("/applications/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalApplications").value(0))
                .andExpect(jsonPath("$.responseRate").value(0.0))
                .andExpect(jsonPath("$.monthlyApplications").isArray())
                .andExpect(jsonPath("$.monthlyApplications").isEmpty());
    }

    @Test
    void getStats_Returns401_WhenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/applications/stats"))
                .andExpect(status().isUnauthorized());
    }

    // ── PATCH /applications/{id} ─────────────────────────────────────────────

    private ApplicationRequest validUpdateRequest() {
        ApplicationRequest request = new ApplicationRequest();
        request.setCompanyName("Google Updated");
        request.setJobRole("Senior Developer");
        request.setLocation("Tel Aviv");
        request.setStatus(Status.INTERVIEWING);
        request.setJobType(JobType.FULL_TIME);
        request.setAppliedDate(LocalDate.now());
        request.setWebsiteLink("https://google.com");
        return request;
    }

    @Test
    @WithMockUser
    void updateApplication_ReturnsSuccess_WhenValidRequest() throws Exception {
        UUID appId = UUID.randomUUID();
        ApplicationResponse updated = new ApplicationResponse(
                appId, "Google Updated", JobType.FULL_TIME, "Tel Aviv", "Senior Developer",
                LocalDate.now(), Status.INTERVIEWING, null, "https://google.com", null
        );
        when(applicationService.updateApplicationByUser(eq(appId), any(ApplicationRequest.class)))
                .thenReturn(updated);

        mockMvc.perform(patch("/applications/" + appId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validUpdateRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyName").value("Google Updated"))
                .andExpect(jsonPath("$.status").value("INTERVIEWING"));
    }

    @Test
    @WithMockUser
    void updateApplication_ReturnsNotFound_WhenIdDoesNotExist() throws Exception {
        UUID randomId = UUID.randomUUID();
        when(applicationService.updateApplicationByUser(eq(randomId), any(ApplicationRequest.class)))
                .thenThrow(new ResourceNotFoundException("Application not found"));

        mockMvc.perform(patch("/applications/" + randomId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validUpdateRequest())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Application not found"));
    }

    @Test
    @WithMockUser
    void updateApplication_ReturnsForbidden_WhenAccessingOtherUserData() throws Exception {
        UUID appId = UUID.randomUUID();
        when(applicationService.updateApplicationByUser(eq(appId), any(ApplicationRequest.class)))
                .thenThrow(new AccessDeniedException("Access denied"));

        mockMvc.perform(patch("/applications/" + appId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validUpdateRequest())))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));
    }

    // ── GET /applications/{id}/credentials ───────────────────────────────────

    @Test
    @WithMockUser
    void getApplicationCredentials_ReturnsCredentials_WhenUserOwnsApplication() throws Exception {
        UUID appId = UUID.randomUUID();
        CredentialsResponse credentials = new CredentialsResponse("portal_user", "secret123");
        when(applicationService.getApplicationCredentials(appId)).thenReturn(credentials);

        mockMvc.perform(get("/applications/" + appId + "/credentials"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("portal_user"))
                .andExpect(jsonPath("$.password").value("secret123"));
    }

    @Test
    @WithMockUser
    void getApplicationCredentials_ReturnsNotFound_WhenIdDoesNotExist() throws Exception {
        UUID randomId = UUID.randomUUID();
        when(applicationService.getApplicationCredentials(randomId))
                .thenThrow(new ResourceNotFoundException("Application not found"));

        mockMvc.perform(get("/applications/" + randomId + "/credentials"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Application not found"));
    }

    @Test
    @WithMockUser
    void getApplicationCredentials_ReturnsForbidden_WhenAccessingOtherUserData() throws Exception {
        UUID appId = UUID.randomUUID();
        when(applicationService.getApplicationCredentials(appId))
                .thenThrow(new AccessDeniedException("Access denied"));

        mockMvc.perform(get("/applications/" + appId + "/credentials"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));
    }

    @Test
    void getApplicationCredentials_Returns401_WhenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/applications/" + UUID.randomUUID() + "/credentials"))
                .andExpect(status().isUnauthorized());
    }

    // ── GET /applications with query params ──────────────────────────────────

    @Test
    @WithMockUser
    void createApplication_ReturnsBadRequest_WhenWebsiteLinkIsInvalidUrl() throws Exception {
        ApplicationRequest request = new ApplicationRequest();
        request.setCompanyName("Google");
        request.setJobRole("Developer");
        request.setLocation("Tel Aviv");
        request.setStatus(Status.APPLIED);
        request.setJobType(JobType.FULL_TIME);
        request.setAppliedDate(LocalDate.now());
        request.setWebsiteLink("not-a-valid-url");

        mockMvc.perform(post("/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @WithMockUser
    void createApplication_ReturnsBadRequest_WhenCompanyNameExceedsMaxLength() throws Exception {
        ApplicationRequest request = new ApplicationRequest();
        request.setCompanyName("A".repeat(256));
        request.setJobRole("Developer");
        request.setLocation("Tel Aviv");
        request.setStatus(Status.APPLIED);
        request.setJobType(JobType.FULL_TIME);
        request.setAppliedDate(LocalDate.now());
        request.setWebsiteLink("https://google.com");

        mockMvc.perform(post("/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @WithMockUser
    void getAllApplications_FiltersResults_WhenSearchParamProvided() throws Exception {
        ApplicationResponse app = new ApplicationResponse(
                UUID.randomUUID(), "Google", JobType.FULL_TIME, "Tel Aviv", "Developer",
                LocalDate.now(), Status.APPLIED, null, "https://google.com", null
        );
        when(applicationService.getAllApplicationsByUser(eq("Google"), isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(app)));

        mockMvc.perform(get("/applications").param("search", "Google"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].companyName").value("Google"));
    }

    @Test
    @WithMockUser
    void getAllApplications_FiltersResults_WhenStatusParamProvided() throws Exception {
        ApplicationResponse app = new ApplicationResponse(
                UUID.randomUUID(), "Google", JobType.FULL_TIME, "Tel Aviv", "Developer",
                LocalDate.now(), Status.APPLIED, null, "https://google.com", null
        );
        when(applicationService.getAllApplicationsByUser(isNull(), eq(Status.APPLIED), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(app)));

        mockMvc.perform(get("/applications").param("status", "APPLIED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].status").value("APPLIED"));
    }
}