package com.nadavramon.job_tracker.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nadavramon.job_tracker.dto.AiExtractResponse;
import com.nadavramon.job_tracker.entity.User;
import com.nadavramon.job_tracker.exception.AiServiceException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import org.mockito.Answers;

@ExtendWith(MockitoExtension.class)
public class AiExtractionServiceTest {

    @Mock
    private UserService userService;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private UrlFetchService urlFetchService;

    @Mock
    private RestClient anthropicClient;

    private ObjectMapper objectMapper;
    private AiExtractionService service;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        service = new AiExtractionService(
                userService, currentUserService, urlFetchService, objectMapper, anthropicClient,
                "claude-sonnet-4-6", 512, 15
        );
    }

    private void setUpCurrentUser(String username) {
        User user = new User();
        user.setUsername(username);
        when(currentUserService.getCurrentUser()).thenReturn(user);
    }

    /**
     * Sets up the Anthropic RestClient mock chain and returns the final RequestBodySpec
     * so callers can stub retrieve() to either return a response or throw.
     */
    private RestClient.RequestBodySpec mockAnthropicClientChain() {
        RestClient.RequestBodyUriSpec bodyUriSpec = mock(RestClient.RequestBodyUriSpec.class);
        RestClient.RequestBodySpec bodySpec = mock(RestClient.RequestBodySpec.class, Answers.RETURNS_SELF);

        when(anthropicClient.post()).thenReturn(bodyUriSpec);
        when(bodyUriSpec.header(anyString(), anyString())).thenReturn(bodySpec);

        return bodySpec;
    }

    // --- Missing API key ---

    @Test
    void extract_ThrowsBadRequest_WhenApiKeyIsNull() {
        when(userService.getUserApiKey()).thenReturn(null);

        AiServiceException ex = assertThrows(AiServiceException.class, () -> service.extract("some text"));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getHttpStatus());
        assertTrue(ex.getMessage().contains("API key not configured"));
    }

    // --- Rate limiting ---

    @Test
    void extract_ThrowsTooManyRequests_AfterRateLimitExceeded() {
        setUpCurrentUser("ratelimituser");
        when(userService.getUserApiKey()).thenReturn("sk-ant-test-key");

        RestClient.RequestBodySpec bodySpec = mockAnthropicClientChain();
        RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);
        when(bodySpec.retrieve()).thenReturn(responseSpec);

        String validResponse = """
                {
                    "content": [{
                        "type": "tool_use",
                        "id": "test",
                        "name": "extract_job_posting",
                        "input": {
                            "companyName": "Test",
                            "jobRole": "Engineer",
                            "location": null,
                            "jobType": null,
                            "websiteLink": null
                        }
                    }]
                }
                """;
        when(responseSpec.body(String.class)).thenReturn(validResponse);

        // Exhaust the rate limit (15 requests)
        for (int i = 0; i < 15; i++) {
            service.extract("text " + i);
        }

        // 16th request should fail
        AiServiceException ex = assertThrows(AiServiceException.class, () -> service.extract("one more"));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getHttpStatus());
        assertTrue(ex.getMessage().contains("Too many requests"));
    }

    // --- Anthropic error handling ---

    @Test
    void extract_ThrowsBadGateway_WhenAnthropicReturns401() {
        setUpCurrentUser("testuser401");
        when(userService.getUserApiKey()).thenReturn("sk-ant-bad-key");

        RestClient.RequestBodySpec bodySpec = mockAnthropicClientChain();
        when(bodySpec.retrieve()).thenThrow(HttpClientErrorException.create(
                HttpStatusCode.valueOf(401), "Unauthorized", null, null, null));

        AiServiceException ex = assertThrows(AiServiceException.class, () -> service.extract("test text"));
        assertEquals(HttpStatus.BAD_GATEWAY, ex.getHttpStatus());
        assertTrue(ex.getMessage().contains("Invalid API key"));
    }

    @Test
    void extract_ThrowsTooManyRequests_WhenAnthropicReturns429() {
        setUpCurrentUser("testuser429");
        when(userService.getUserApiKey()).thenReturn("sk-ant-key");

        RestClient.RequestBodySpec bodySpec = mockAnthropicClientChain();
        when(bodySpec.retrieve()).thenThrow(HttpClientErrorException.create(
                HttpStatusCode.valueOf(429), "Too Many Requests", null, null, null));

        AiServiceException ex = assertThrows(AiServiceException.class, () -> service.extract("test text"));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getHttpStatus());
    }

    @Test
    void extract_ThrowsBadGateway_WhenAnthropicReturns500() {
        setUpCurrentUser("testuser500");
        when(userService.getUserApiKey()).thenReturn("sk-ant-key");

        RestClient.RequestBodySpec bodySpec = mockAnthropicClientChain();
        when(bodySpec.retrieve()).thenThrow(HttpServerErrorException.create(
                HttpStatusCode.valueOf(500), "Internal Server Error", null, null, null));

        AiServiceException ex = assertThrows(AiServiceException.class, () -> service.extract("test text"));
        assertEquals(HttpStatus.BAD_GATEWAY, ex.getHttpStatus());
    }

    // --- Successful extraction ---

    @Test
    void extract_ReturnsResponse_WhenAnthropicReturnsValidToolUse() {
        setUpCurrentUser("testuserSuccess");
        when(userService.getUserApiKey()).thenReturn("sk-ant-key");

        RestClient.RequestBodySpec bodySpec = mockAnthropicClientChain();
        RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);
        when(bodySpec.retrieve()).thenReturn(responseSpec);

        String anthropicResponse = """
                {
                    "id": "msg_123",
                    "type": "message",
                    "role": "assistant",
                    "content": [{
                        "type": "tool_use",
                        "id": "toolu_123",
                        "name": "extract_job_posting",
                        "input": {
                            "companyName": "Google",
                            "jobRole": "Software Engineer",
                            "location": "Mountain View, CA",
                            "jobType": "FULL_TIME",
                            "websiteLink": "https://careers.google.com/jobs/123"
                        }
                    }]
                }
                """;
        when(responseSpec.body(String.class)).thenReturn(anthropicResponse);

        AiExtractResponse result = service.extract("Software Engineer at Google");

        assertEquals("Google", result.getCompanyName());
        assertEquals("Software Engineer", result.getJobRole());
        assertEquals("Mountain View, CA", result.getLocation());
        assertEquals("FULL_TIME", result.getJobType());
        assertEquals("https://careers.google.com/jobs/123", result.getWebsiteLink());
    }

    @Test
    void extract_ReturnsResponseWithNulls_WhenFieldsMissing() {
        setUpCurrentUser("testuserPartial");
        when(userService.getUserApiKey()).thenReturn("sk-ant-key");

        RestClient.RequestBodySpec bodySpec = mockAnthropicClientChain();
        RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);
        when(bodySpec.retrieve()).thenReturn(responseSpec);

        String anthropicResponse = """
                {
                    "content": [{
                        "type": "tool_use",
                        "id": "toolu_456",
                        "name": "extract_job_posting",
                        "input": {
                            "companyName": "Startup Inc",
                            "jobRole": "Designer"
                        }
                    }]
                }
                """;
        when(responseSpec.body(String.class)).thenReturn(anthropicResponse);

        AiExtractResponse result = service.extract("Designer at Startup Inc");

        assertEquals("Startup Inc", result.getCompanyName());
        assertEquals("Designer", result.getJobRole());
        assertNull(result.getLocation());
        assertNull(result.getJobType());
        assertNull(result.getWebsiteLink());
    }
}
