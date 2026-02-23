package com.nadavramon.job_tracker.controller;

import com.nadavramon.job_tracker.dto.ApplicationRequest;
import com.nadavramon.job_tracker.dto.ApplicationResponse;
import com.nadavramon.job_tracker.dto.ApplicationStatsResponse;
import com.nadavramon.job_tracker.enums.Status;
import com.nadavramon.job_tracker.service.ApplicationService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @GetMapping
    public Page<ApplicationResponse> getAllApplications(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Status status,
            @PageableDefault(size = 20, sort = "appliedDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return applicationService.getAllApplicationsByUser(search, status, pageable);
    }

    @GetMapping("/stats")
    public ApplicationStatsResponse getStats() {
        return applicationService.getApplicationStats();
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
