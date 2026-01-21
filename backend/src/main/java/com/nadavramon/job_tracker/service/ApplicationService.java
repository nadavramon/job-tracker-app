package com.nadavramon.job_tracker.service;

import com.nadavramon.job_tracker.dto.ApplicationRequest;
import com.nadavramon.job_tracker.dto.ApplicationResponse;
import com.nadavramon.job_tracker.entity.Application;
import com.nadavramon.job_tracker.entity.User;
import com.nadavramon.job_tracker.exception.AccessDeniedException;
import com.nadavramon.job_tracker.exception.ResourceNotFoundException;
import com.nadavramon.job_tracker.repository.ApplicationRepository;
import com.nadavramon.job_tracker.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;

    public ApplicationService(ApplicationRepository applicationRepository, UserRepository userRepository) {
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
    }

    public List<ApplicationResponse> getAllApplicationsByUser() {
        List<Application> applications = applicationRepository.findByUser(getCurrentUser());
        List<ApplicationResponse> responses = new ArrayList<>();

        for (Application application : applications) {
            responses.add(toResponse(application));
        }
        return responses;
    }

    public ApplicationResponse getApplicationByUser(UUID id) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User's application not found"));

        if (!application.getUser().getId().equals(getCurrentUser().getId()))
            throw new AccessDeniedException("Access denied");
        return toResponse(application);
    }

    public ApplicationResponse createApplicationByUser(ApplicationRequest request) {
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
        return toResponse(applicationRepository.save(application));
    }

    public ApplicationResponse updateApplicationByUser(UUID id, ApplicationRequest request) {
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

        return toResponse(applicationRepository.save(application));
    }

    public void deleteApplicationByUser(UUID id) {
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

    private ApplicationResponse toResponse(Application application) {
        return new ApplicationResponse(
                application.getId(),
                application.getCompanyName(),
                application.getJobType(),
                application.getLocation(),
                application.getJobRole(),
                application.getAppliedDate(),
                application.getStatus(),
                application.getStatusChangedDate(),
                application.getWebsiteLink(),
                application.getUsername(),
                application.getPassword()
        );
    }
}
