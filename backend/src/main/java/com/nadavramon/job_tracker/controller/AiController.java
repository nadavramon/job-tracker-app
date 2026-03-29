package com.nadavramon.job_tracker.controller;

import com.nadavramon.job_tracker.dto.AiExtractRequest;
import com.nadavramon.job_tracker.dto.AiExtractResponse;
import com.nadavramon.job_tracker.service.AiExtractionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/me/ai")
public class AiController {

    private final AiExtractionService aiExtractionService;

    public AiController(AiExtractionService aiExtractionService) {
        this.aiExtractionService = aiExtractionService;
    }

    @PostMapping("/extract")
    public ResponseEntity<AiExtractResponse> extract(@Valid @RequestBody AiExtractRequest request) {
        AiExtractResponse response = aiExtractionService.extract(request.getText());
        return ResponseEntity.ok(response);
    }
}
