package com.nadavramon.job_tracker.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nadavramon.job_tracker.dto.AiExtractResponse;
import com.nadavramon.job_tracker.exception.AiServiceException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClient;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import org.mockito.Answers;

@ExtendWith(MockitoExtension.class)
public class AiExtractionServiceTest {

    @Mock
    private UserService userService;

    @Mock
    private RestClient anthropicClient;

    @Mock
    private RestClient urlFetchClient;

    private ObjectMapper objectMapper;
    private AiExtractionService service;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        service = new AiExtractionService(
                userService, objectMapper, anthropicClient, urlFetchClient,
                "claude-sonnet-4-6", 512, 15
        );
    }

    private void setUpSecurityContext(String username) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(username, null, Collections.emptyList())
        );
    }

    /**
     * Sets up the Anthropic RestClient mock chain and returns the final RequestBodySpec
     * so callers can stub retrieve() to either return a response or throw.
     */
    private RestClient.RequestBodySpec mockAnthropicClientChain() {
        RestClient.RequestBodyUriSpec bodyUriSpec = mock(RestClient.RequestBodyUriSpec.class);
        RestClient.RequestBodySpec bodySpec = mock(RestClient.RequestBodySpec.class, Answers.RETURNS_SELF);

        when(anthropicClient.post()).thenReturn(bodyUriSpec);
        // header() on the UriSpec returns the bodySpec
        when(bodyUriSpec.header(anyString(), anyString())).thenReturn(bodySpec);

        return bodySpec;
    }

    // --- Missing API key ---

    @Test
    void extract_ThrowsBadRequest_WhenApiKeyIsNull() {
        setUpSecurityContext("testuser");
        when(userService.getUserApiKey()).thenReturn(null);

        AiServiceException ex = assertThrows(AiServiceException.class, () -> service.extract("some text"));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getHttpStatus());
        assertTrue(ex.getMessage().contains("API key not configured"));
    }

    // --- SSRF: isPrivateHost ---

    @ParameterizedTest
    @ValueSource(strings = {
            "localhost",
            "127.0.0.1",
            "127.255.255.255",
            "10.0.0.1",
            "10.255.255.255",
            "172.16.0.1",
            "172.31.255.255",
            "192.168.0.1",
            "192.168.255.255",
            "169.254.0.1",
            "169.254.255.255",
            "0.0.0.0",
            "0.1.2.3",
            "[::1]"
    })
    void isPrivateHost_ReturnsTrue_ForPrivateAddresses(String host) {
        assertTrue(service.isPrivateHost(host), "Expected " + host + " to be private");
    }

    @Test
    void isPrivateHost_ReturnsTrue_ForIpv6Loopback() {
        assertTrue(service.isPrivateHost("::1"));
    }

    @Test
    void isPrivateHost_ReturnsTrue_ForIpv6LinkLocal() {
        assertTrue(service.isPrivateHost("fe80:0000:0000:0000:0000:0000:0000:0001"));
    }

    @Test
    void isPrivateHost_ReturnsTrue_ForIpv6UniqueLocal() {
        assertTrue(service.isPrivateHost("fc00::1"));
        assertTrue(service.isPrivateHost("fd00::1"));
    }

    // --- Port restriction ---

    @Test
    void validateAndResolveUrl_ThrowsBadRequest_ForNonStandardPort() {
        AiServiceException ex = assertThrows(AiServiceException.class,
                () -> service.validateAndResolveUrl("https://example.com:8080/path"));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getHttpStatus());
        assertTrue(ex.getMessage().contains("standard HTTP ports"));
    }

    @Test
    void validateAndResolveUrl_AllowsPort80() {
        // Should not throw for port 80 (may throw for private host resolution, but not for port)
        // We test that it doesn't throw the port error
        try {
            service.validateAndResolveUrl("http://example.com:80/path");
        } catch (AiServiceException e) {
            assertFalse(e.getMessage().contains("standard HTTP ports"),
                    "Port 80 should be allowed");
        }
    }

    @Test
    void validateAndResolveUrl_AllowsPort443() {
        try {
            service.validateAndResolveUrl("https://example.com:443/path");
        } catch (AiServiceException e) {
            assertFalse(e.getMessage().contains("standard HTTP ports"),
                    "Port 443 should be allowed");
        }
    }

    @Test
    void validateAndResolveUrl_AllowsDefaultPort() {
        // Default port (-1) should be allowed
        try {
            service.validateAndResolveUrl("https://example.com/path");
        } catch (AiServiceException e) {
            assertFalse(e.getMessage().contains("standard HTTP ports"),
                    "Default port should be allowed");
        }
    }

    @Test
    void validateAndResolveUrl_ThrowsBadRequest_ForPrivateHost() {
        AiServiceException ex = assertThrows(AiServiceException.class,
                () -> service.validateAndResolveUrl("https://localhost/path"));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getHttpStatus());
        assertTrue(ex.getMessage().contains("private or reserved"));
    }

    @Test
    void validateAndResolveUrl_ThrowsBadRequest_ForNonHttpScheme() {
        AiServiceException ex = assertThrows(AiServiceException.class,
                () -> service.validateAndResolveUrl("ftp://example.com/path"));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getHttpStatus());
        assertTrue(ex.getMessage().contains("HTTP and HTTPS"));
    }

    @Test
    void validateAndResolveUrl_DoesNotThrow_ForValidPublicUrl() {
        // Should not throw for a valid public URL
        assertDoesNotThrow(() -> service.validateAndResolveUrl("https://example.com/path?q=1"));
    }

    // --- Rate limiting ---

    @Test
    void extract_ThrowsTooManyRequests_AfterRateLimitExceeded() {
        setUpSecurityContext("ratelimituser");
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
        setUpSecurityContext("testuser401");
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
        setUpSecurityContext("testuser429");
        when(userService.getUserApiKey()).thenReturn("sk-ant-key");

        RestClient.RequestBodySpec bodySpec = mockAnthropicClientChain();
        when(bodySpec.retrieve()).thenThrow(HttpClientErrorException.create(
                HttpStatusCode.valueOf(429), "Too Many Requests", null, null, null));

        AiServiceException ex = assertThrows(AiServiceException.class, () -> service.extract("test text"));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getHttpStatus());
    }

    @Test
    void extract_ThrowsBadGateway_WhenAnthropicReturns500() {
        setUpSecurityContext("testuser500");
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
        setUpSecurityContext("testuserSuccess");
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
        setUpSecurityContext("testuserPartial");
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
