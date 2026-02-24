package com.nadavramon.job_tracker.dto;

import com.nadavramon.job_tracker.enums.ThemePreference;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public class UpdateProfileRequest {

    @Email
    private String email;

    @Size(min = 3, max = 14)
    private String username;

    @Size(min = 8, max = 14)
    private String password;

    private ThemePreference themePreference;

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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public ThemePreference getThemePreference() {
        return themePreference;
    }

    public void setThemePreference(ThemePreference themePreference) {
        this.themePreference = themePreference;
    }
}
