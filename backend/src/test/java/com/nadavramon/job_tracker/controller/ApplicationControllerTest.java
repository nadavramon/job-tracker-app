package com.nadavramon.job_tracker.controller;

import com.nadavramon.job_tracker.entity.Application;
import com.nadavramon.job_tracker.repository.ApplicationRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@WebMvcTest(ApplicationController.class)
public class ApplicationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ApplicationRepository applicationRepository;

    @Test
    @WithMockUser
    void getAllApplications_ReturnsEmptyList_WhenNoApplicationsExist() throws Exception {
        when(applicationRepository.findAll()).thenReturn(List.of());

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

        Application app2 = new Application();
        app2.setCompanyName("Microsoft");
        app2.setLocation("Herzliya");

        when(applicationRepository.findAll()).thenReturn(List.of(app1, app2));

        mockMvc.perform(get("/applications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].companyName").value("Google"))
                .andExpect(jsonPath("$[1].companyName").value("Microsoft"));
    }

    @Test
    void getAllApplications_Returns401_WhenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/applications"))
                .andExpect(status().isUnauthorized());
    }
}