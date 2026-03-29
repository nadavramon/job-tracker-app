package com.nadavramon.job_tracker.dto;

import com.nadavramon.job_tracker.enums.ThemePreference;

import java.util.UUID;

public class UserProfileResponse {

    private UUID id;
    private String email;
    private String username;
    private ThemePreference themePreference;
    private boolean hasApiKey;

    public UserProfileResponse(UUID id, String email, String username, ThemePreference themePreference,
                               boolean hasApiKey) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.themePreference = themePreference;
        this.hasApiKey = hasApiKey;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public ThemePreference getThemePreference() {
        return themePreference;
    }

    public void setThemePreference(ThemePreference themePreference) {
        this.themePreference = themePreference;
    }

    public boolean isHasApiKey() {
        return hasApiKey;
    }

    public void setHasApiKey(boolean hasApiKey) {
        this.hasApiKey = hasApiKey;
    }
}
