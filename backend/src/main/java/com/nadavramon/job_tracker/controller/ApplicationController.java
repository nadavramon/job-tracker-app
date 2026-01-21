package com.nadavramon.job_tracker.controller;

import com.nadavramon.job_tracker.dto.ApplicationRequest;
import com.nadavramon.job_tracker.dto.ApplicationResponse;
import com.nadavramon.job_tracker.service.ApplicationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @GetMapping
    public List<ApplicationResponse> getAllApplications() {
        return applicationService.getAllApplicationsByUser();
    }

    @GetMapping("/{id}")
    public ApplicationResponse getApplication(@PathVariable UUID id) {
        return applicationService.getApplicationByUser(id);
    }

    @PostMapping
    public ApplicationResponse createApplication(@Valid @RequestBody ApplicationRequest request) {
        return applicationService.createApplicationByUser(request);
    }

    @PatchMapping("/{id}")
    public ApplicationResponse updateApplication(@PathVariable UUID id
            , @Valid @RequestBody ApplicationRequest request) {
        return applicationService.updateApplicationByUser(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteApplication(@PathVariable UUID id) {
        applicationService.deleteApplicationByUser(id);
    }
}
