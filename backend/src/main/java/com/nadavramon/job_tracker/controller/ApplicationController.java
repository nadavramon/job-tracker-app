package com.nadavramon.job_tracker.controller;

import com.nadavramon.job_tracker.dto.ApplicationRequest;
import com.nadavramon.job_tracker.entity.Application;
import com.nadavramon.job_tracker.entity.User;
import com.nadavramon.job_tracker.repository.ApplicationRepository;
import com.nadavramon.job_tracker.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/applications")
public class ApplicationController {

    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;

    public ApplicationController(ApplicationRepository applicationRepository, UserRepository userRepository) {
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Application> getAllApplications() {
        return applicationRepository.findByUser(getCurrentUser());
    }

    @GetMapping("/{id}")
    public Application getApplicationById(@PathVariable UUID id) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (!application.getUser().getId().equals(getCurrentUser().getId()))
            throw new RuntimeException("Access denied");
        return application;
    }

    @PostMapping
    public Application createApplication(@Valid @RequestBody ApplicationRequest request) {
        Application application = new Application();

        application.setCompanyName(request.getCompanyName());
        application.setJobRole(request.getJobRole());
        application.setLocation(request.getLocation());
        application.setStatus(request.getStatus());
        application.setJobType(request.getJobType());
        application.setAppliedDate(request.getAppliedDate());
        application.setWebsiteLink(request.getWebsiteLink());
        application.setUsername(request.getUsername());
        application.setPassword(request.getPassword());

        application.setUser(getCurrentUser());
        return applicationRepository.save(application);
    }

    @PatchMapping("/{id}")
    public Application updateApplication(@PathVariable UUID id, @RequestBody Application applicationDetails) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (!application.getUser().getId().equals(getCurrentUser().getId())) {
            throw new RuntimeException("Access denied");
        }

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
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (!application.getUser().getId().equals(getCurrentUser().getId())) {
            throw new RuntimeException("Access denied");
        }

        applicationRepository.deleteById(id);
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
