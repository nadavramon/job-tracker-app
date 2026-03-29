package com.nadavramon.job_tracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AiExtractRequest {

    @NotBlank(message = "Text is required")
    @Size(max = 50000, message = "Text must be under 50,000 characters")
    private String text;

    public AiExtractRequest() {
    }

    public AiExtractRequest(String text) {
        this.text = text;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }
}
