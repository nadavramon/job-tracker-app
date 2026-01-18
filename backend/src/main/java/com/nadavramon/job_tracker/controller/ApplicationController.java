package com.nadavramon.job_tracker.controller;

import com.nadavramon.job_tracker.entity.Application;
import com.nadavramon.job_tracker.repository.ApplicationRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/applications")
public class ApplicationController {

    private final ApplicationRepository applicationRepository;

    public ApplicationController(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    @GetMapping
    public List<Application> getAllApplications() {
        return applicationRepository.findAll();
    }

    @GetMapping("/{id}")
    public Application getApplicationById(@PathVariable UUID id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
    }

    @PostMapping
    public Application createApplication(@RequestBody Application application) {
        return applicationRepository.save(application);
    }

    @PatchMapping("/{id}")
    public Application updateApplication(@PathVariable UUID id, @RequestBody Application applicationDetails) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (applicationDetails.getCompanyName() != null) {
            application.setCompanyName(applicationDetails.getCompanyName());
        }
        if (applicationDetails.getLocation() != null) {
            application.setLocation(applicationDetails.getLocation());
        }
        if (applicationDetails.getJobType() != null) {
            application.setJobType(applicationDetails.getJobType());
        }
        if (applicationDetails.getJobRole() != null) {
            application.setJobRole(applicationDetails.getJobRole());
        }
        if (applicationDetails.getStatus() != null) {
            application.setStatus(applicationDetails.getStatus());
        }
        if (applicationDetails.getAppliedDate() != null) {
            application.setAppliedDate(applicationDetails.getAppliedDate());
        }
        if (applicationDetails.getStatusChangedDate() != null) {
            application.setStatusChangedDate(applicationDetails.getStatusChangedDate());
        }
        if (applicationDetails.getWebsiteLink() != null) {
            application.setWebsiteLink(applicationDetails.getWebsiteLink());
        }
        if (applicationDetails.getUsername() != null) {
            application.setUsername(applicationDetails.getUsername());
        }
        if (applicationDetails.getPassword() != null) {
            application.setPassword(applicationDetails.getPassword());
        }

        return applicationRepository.save(application);
    }

    @DeleteMapping("/{id}")
    public void deleteApplication(@PathVariable UUID id) {
        applicationRepository.deleteById(id);
    }
}
