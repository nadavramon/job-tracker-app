package com.nadavramon.job_tracker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nadavramon.job_tracker.config.JwtAuthenticationFilter;
import com.nadavramon.job_tracker.config.RateLimitFilter;
import com.nadavramon.job_tracker.config.SecurityConfig;
import com.nadavramon.job_tracker.dto.AiExtractRequest;
import com.nadavramon.job_tracker.dto.AiExtractResponse;
import com.nadavramon.job_tracker.exception.AiServiceException;
import com.nadavramon.job_tracker.service.AiExtractionService;
import com.nadavramon.job_tracker.service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AiController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, RateLimitFilter.class})
public class AiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private AiExtractionService aiExtractionService;

    @MockitoBean
    private JwtService jwtService;

    @Test
    void extract_Returns401_WhenNotAuthenticated() throws Exception {
        AiExtractRequest request = new AiExtractRequest("Some job posting text");

        mockMvc.perform(post("/me/ai/extract")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
    void extract_Returns400_WhenTextIsBlank() throws Exception {
        AiExtractRequest request = new AiExtractRequest("   ");

        mockMvc.perform(post("/me/ai/extract")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @WithMockUser
    void extract_ReturnsExtraction_WhenValidRequest() throws Exception {
        AiExtractResponse response = new AiExtractResponse(
                "Google", "Software Engineer", "Mountain View, CA", "FULL_TIME", "https://careers.google.com"
        );
        when(aiExtractionService.extract(anyString())).thenReturn(response);

        AiExtractRequest request = new AiExtractRequest("Software Engineer at Google in Mountain View");

        mockMvc.perform(post("/me/ai/extract")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.companyName").value("Google"))
                .andExpect(jsonPath("$.jobRole").value("Software Engineer"))
                .andExpect(jsonPath("$.location").value("Mountain View, CA"))
                .andExpect(jsonPath("$.jobType").value("FULL_TIME"))
                .andExpect(jsonPath("$.websiteLink").value("https://careers.google.com"));
    }

    @Test
    @WithMockUser
    void extract_Returns429_WhenRateLimited() throws Exception {
        when(aiExtractionService.extract(anyString()))
                .thenThrow(new AiServiceException(HttpStatus.TOO_MANY_REQUESTS, "Too many requests. Please wait a moment."));

        AiExtractRequest request = new AiExtractRequest("Some job posting text");

        mockMvc.perform(post("/me/ai/extract")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message").value("Too many requests. Please wait a moment."));
    }

    @Test
    @WithMockUser
    void extract_Returns502_WhenAiServiceFails() throws Exception {
        when(aiExtractionService.extract(anyString()))
                .thenThrow(new AiServiceException(HttpStatus.BAD_GATEWAY, "AI service is temporarily unavailable."));

        AiExtractRequest request = new AiExtractRequest("Some job posting text");

        mockMvc.perform(post("/me/ai/extract")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.message").value("AI service is temporarily unavailable."));
    }

    @Test
    @WithMockUser
    void extract_Returns400_WhenApiKeyNotConfigured() throws Exception {
        when(aiExtractionService.extract(anyString()))
                .thenThrow(new AiServiceException(HttpStatus.BAD_REQUEST, "Anthropic API key not configured. Add your key in Settings."));

        AiExtractRequest request = new AiExtractRequest("Some job posting text");

        mockMvc.perform(post("/me/ai/extract")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Anthropic API key not configured. Add your key in Settings."));
    }
}
