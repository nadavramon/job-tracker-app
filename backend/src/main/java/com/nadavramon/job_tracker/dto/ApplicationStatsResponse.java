package com.nadavramon.job_tracker.dto;

import com.nadavramon.job_tracker.enums.Status;

import java.util.List;
import java.util.Map;

public class ApplicationStatsResponse {

    private int totalApplications;
    private Map<Status, Long> statusBreakdown;
    private List<MonthlyCount> monthlyApplications;
    private double responseRate;

    public ApplicationStatsResponse(int totalApplications, Map<Status, Long> statusBreakdown,
                                    List<MonthlyCount> monthlyApplications, double responseRate) {
        this.totalApplications = totalApplications;
        this.statusBreakdown = statusBreakdown;
        this.monthlyApplications = monthlyApplications;
        this.responseRate = responseRate;
    }

    public int getTotalApplications() {
        return totalApplications;
    }

    public void setTotalApplications(int totalApplications) {
        this.totalApplications = totalApplications;
    }

    public Map<Status, Long> getStatusBreakdown() {
        return statusBreakdown;
    }

    public void setStatusBreakdown(Map<Status, Long> statusBreakdown) {
        this.statusBreakdown = statusBreakdown;
    }

    public List<MonthlyCount> getMonthlyApplications() {
        return monthlyApplications;
    }

    public void setMonthlyApplications(List<MonthlyCount> monthlyApplications) {
        this.monthlyApplications = monthlyApplications;
    }

    public double getResponseRate() {
        return responseRate;
    }

    public void setResponseRate(double responseRate) {
        this.responseRate = responseRate;
    }
}
