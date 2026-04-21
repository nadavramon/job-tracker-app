package com.nadavramon.job_tracker.service;

import com.nadavramon.job_tracker.dto.ApplicationRequest;
import com.nadavramon.job_tracker.dto.ApplicationUpdateRequest;
import com.nadavramon.job_tracker.dto.ApplicationResponse;
import com.nadavramon.job_tracker.dto.ApplicationStatsResponse;
import com.nadavramon.job_tracker.dto.CredentialsResponse;
import com.nadavramon.job_tracker.dto.MonthlyCount;
import com.nadavramon.job_tracker.entity.Application;
import com.nadavramon.job_tracker.entity.User;
import com.nadavramon.job_tracker.enums.Status;
import com.nadavramon.job_tracker.exception.ResourceOwnershipException;
import com.nadavramon.job_tracker.exception.ResourceNotFoundException;
import com.nadavramon.job_tracker.repository.ApplicationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final CurrentUserService currentUserService;
    private final EncryptionService encryptionService;

    public ApplicationService(ApplicationRepository applicationRepository, CurrentUserService currentUserService,
                              EncryptionService encryptionService) {
        this.applicationRepository = applicationRepository;
        this.currentUserService = currentUserService;
        this.encryptionService = encryptionService;
    }

    public Page<ApplicationResponse> getAllApplicationsByUser(String search, Status status, Pageable pageable) {
        return applicationRepository
                .findByUserWithFilters(getCurrentUser(), search, status, pageable)
                .map(this::toResponse);
    }

    public ApplicationResponse getApplicationByUser(UUID id) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User's application not found"));

        if (!application.getUser().getId().equals(getCurrentUser().getId()))
            throw new ResourceOwnershipException("Access denied");
        return toResponse(application);
    }

    public ApplicationResponse createApplicationByUser(ApplicationRequest request) {
        Application application = new Application();

        application.setCompanyName(request.getCompanyName());
        application.setJobRole(request.getJobRole());
        application.setLocation(request.getLocation());
        application.setStatus(request.getStatus());
        application.setStatusChangedDate(LocalDate.now());
        application.setJobType(request.getJobType());
        application.setAppliedDate(request.getAppliedDate());
        application.setWebsiteLink(request.getWebsiteLink());
        application.setUsername(request.getUsername());
        application.setPassword(encryptionService.encrypt(request.getPassword()));

        application.setUser(getCurrentUser());
        return toResponse(applicationRepository.save(application));
    }

    public ApplicationResponse updateApplicationByUser(UUID id, ApplicationUpdateRequest request) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (!application.getUser().getId().equals(getCurrentUser().getId())) {
            throw new ResourceOwnershipException("Access denied");
        }

        if (request.getCompanyName() != null)
            application.setCompanyName(request.getCompanyName());

        if (request.getLocation() != null)
            application.setLocation(request.getLocation());

        if (request.getJobType() != null)
            application.setJobType(request.getJobType());

        if (request.getJobRole() != null)
            application.setJobRole(request.getJobRole());

        if (request.getStatus() != null && request.getStatus() != application.getStatus()) {
            application.setStatus(request.getStatus());
            application.setStatusChangedDate(LocalDate.now());
        }

        if (request.getAppliedDate() != null)
            application.setAppliedDate(request.getAppliedDate());

        if (request.getWebsiteLink() != null)
            application.setWebsiteLink(request.getWebsiteLink());

        if (request.getUsername() != null)
            application.setUsername(request.getUsername());

        if (request.getPassword() != null)
            application.setPassword(encryptionService.encrypt(request.getPassword()));

        return toResponse(applicationRepository.save(application));
    }

    public ApplicationStatsResponse getApplicationStats() {
        List<Application> applications = applicationRepository.findByUser(getCurrentUser());

        int total = applications.size();

        // Status breakdown — initialize all statuses to 0
        Map<Status, Long> statusBreakdown = new EnumMap<>(Status.class);
        for (Status s : Status.values()) {
            statusBreakdown.put(s, 0L);
        }
        for (Application app : applications) {
            statusBreakdown.merge(app.getStatus(), 1L, Long::sum);
        }

        // Response rate: applications that received any response (not APPLIED, not WITHDRAWN)
        long responded = applications.stream()
                .filter(a -> a.getStatus() == Status.SCREENING
                        || a.getStatus() == Status.INTERVIEWING
                        || a.getStatus() == Status.OFFER
                        || a.getStatus() == Status.REJECTED)
                .count();
        double responseRate = total == 0 ? 0.0
                : Math.round(responded * 1000.0 / total) / 10.0;

        // Monthly applications — last 6 months (inclusive of current month)
        LocalDate now = LocalDate.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");
        List<MonthlyCount> monthly = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate month = now.minusMonths(i);
            int year = month.getYear();
            int mo = month.getMonthValue();
            long count = applications.stream()
                    .filter(a -> a.getAppliedDate() != null
                            && a.getAppliedDate().getYear() == year
                            && a.getAppliedDate().getMonthValue() == mo)
                    .count();
            monthly.add(new MonthlyCount(month.format(formatter), count));
        }

        return new ApplicationStatsResponse(total, statusBreakdown, monthly, responseRate);
    }

    public CredentialsResponse getApplicationCredentials(UUID id) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (!application.getUser().getId().equals(getCurrentUser().getId()))
            throw new ResourceOwnershipException("Access denied");

        return new CredentialsResponse(
                application.getUsername(),
                encryptionService.decrypt(application.getPassword())
        );
    }

    public void deleteApplicationByUser(UUID id) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (!application.getUser().getId().equals(getCurrentUser().getId())) {
            throw new ResourceOwnershipException("Access denied");
        }
        application.setDeletedAt(LocalDateTime.now());
        applicationRepository.save(application);
    }

    private User getCurrentUser() {
        return currentUserService.getCurrentUser();
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
                application.getUsername()
        );
    }
}
