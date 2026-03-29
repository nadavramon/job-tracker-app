package com.nadavramon.job_tracker.dto;

public class AiExtractResponse {

    private String companyName;
    private String jobRole;
    private String location;
    private String jobType;
    private String websiteLink;

    public AiExtractResponse() {
    }

    public AiExtractResponse(String companyName, String jobRole, String location, String jobType, String websiteLink) {
        this.companyName = companyName;
        this.jobRole = jobRole;
        this.location = location;
        this.jobType = jobType;
        this.websiteLink = websiteLink;
    }

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

    public String getJobType() {
        return jobType;
    }

    public void setJobType(String jobType) {
        this.jobType = jobType;
    }

    public String getWebsiteLink() {
        return websiteLink;
    }

    public void setWebsiteLink(String websiteLink) {
        this.websiteLink = websiteLink;
    }
}
