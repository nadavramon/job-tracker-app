package com.nadavramon.job_tracker.dto;

import com.nadavramon.job_tracker.enums.JobType;
import com.nadavramon.job_tracker.enums.Status;

import java.time.LocalDate;
import java.util.UUID;

public class ApplicationResponse {

    private UUID id;
    private String companyName;
    private JobType jobType;
    private String location;
    private String jobRole;
    private LocalDate appliedDate;
    private Status status;
    private LocalDate statusChangedDate;
    private String websiteLink;
    private String username;
    private String password;

    public ApplicationResponse(UUID id, String companyName, JobType jobType, String location, String jobRole
            , LocalDate appliedDate, Status status, LocalDate statusChangedDate, String websiteLink, String username
            , String password) {
        this.id = id;
        this.companyName = companyName;
        this.jobType = jobType;
        this.location = location;
        this.jobRole = jobRole;
        this.appliedDate = appliedDate;
        this.status = status;
        this.statusChangedDate = statusChangedDate;
        this.websiteLink = websiteLink;
        this.username = username;
        this.password = password;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public JobType getJobType() {
        return jobType;
    }

    public void setJobType(JobType jobType) {
        this.jobType = jobType;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getJobRole() {
        return jobRole;
    }

    public void setJobRole(String jobRole) {
        this.jobRole = jobRole;
    }

    public LocalDate getAppliedDate() {
        return appliedDate;
    }

    public void setAppliedDate(LocalDate appliedDate) {
        this.appliedDate = appliedDate;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public LocalDate getStatusChangedDate() {
        return statusChangedDate;
    }

    public void setStatusChangedDate(LocalDate statusChangedDate) {
        this.statusChangedDate = statusChangedDate;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getWebsiteLink() {
        return websiteLink;
    }

    public void setWebsiteLink(String websiteLink) {
        this.websiteLink = websiteLink;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
