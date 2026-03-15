package com.nadavramon.job_tracker.dto;

import com.nadavramon.job_tracker.enums.JobType;
import com.nadavramon.job_tracker.enums.Status;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class ApplicationUpdateRequest {

    @Size(max = 255)
    private String companyName;

    @Size(max = 255)
    private String jobRole;

    @Size(max = 255)
    private String location;

    private Status status;

    private JobType jobType;

    private LocalDate appliedDate;

    @Pattern(regexp = "^https?://.*", message = "must be a valid http or https URL")
    @Size(max = 2048)
    private String websiteLink;

    @Size(max = 255)
    private String username;

    @Size(max = 255)
    private String password;

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getJobRole() {
        return jobRole;
    }

    public void setJobRole(String jobRole) {
        this.jobRole = jobRole;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public JobType getJobType() {
        return jobType;
    }

    public void setJobType(JobType jobType) {
        this.jobType = jobType;
    }

    public LocalDate getAppliedDate() {
        return appliedDate;
    }

    public void setAppliedDate(LocalDate appliedDate) {
        this.appliedDate = appliedDate;
    }

    public String getWebsiteLink() {
        return websiteLink;
    }

    public void setWebsiteLink(String websiteLink) {
        this.websiteLink = websiteLink;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
