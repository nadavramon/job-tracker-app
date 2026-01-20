package com.nadavramon.job_tracker.controller;

import com.nadavramon.job_tracker.dto.ApplicationRequest;
import com.nadavramon.job_tracker.entity.Application;
import com.nadavramon.job_tracker.entity.User;
import com.nadavramon.job_tracker.exception.AccessDeniedException;
import com.nadavramon.job_tracker.exception.ResourceNotFoundException;
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
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (!application.getUser().getId().equals(getCurrentUser().getId()))
            throw new AccessDeniedException("Access denied");
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
    public Application updateApplication(@PathVariable UUID id, @Valid @RequestBody ApplicationRequest request) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (!application.getUser().getId().equals(getCurrentUser().getId())) {
            throw new AccessDeniedException("Access denied");
        }

        if (request.getCompanyName() != null)
            application.setCompanyName(request.getCompanyName());

        if (request.getLocation() != null)
            application.setLocation(request.getLocation());

        if (request.getJobType() != null)
            application.setJobType(request.getJobType());

        if (request.getJobRole() != null)
            application.setJobRole(request.getJobRole());

        if (request.getStatus() != null)
            application.setStatus(request.getStatus());

        if (request.getAppliedDate() != null)
            application.setAppliedDate(request.getAppliedDate());

        if (request.getWebsiteLink() != null)
            application.setWebsiteLink(request.getWebsiteLink());

        if (request.getUsername() != null)
            application.setUsername(request.getUsername());

        if (request.getPassword() != null)
            application.setPassword(request.getPassword());

        return applicationRepository.save(application);
    }

    @DeleteMapping("/{id}")
    public void deleteApplication(@PathVariable UUID id) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (!application.getUser().getId().equals(getCurrentUser().getId())) {
            throw new AccessDeniedException("Access denied");
        }

        applicationRepository.deleteById(id);
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
