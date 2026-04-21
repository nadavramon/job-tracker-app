package com.nadavramon.job_tracker.service;

import com.nadavramon.job_tracker.exception.AiServiceException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class UrlFetchServiceTest {

    @Mock
    private RestClient restClient;

    private UrlFetchService service;

    @BeforeEach
    void setUp() {
        service = new UrlFetchService(restClient);
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
        assertDoesNotThrow(() -> service.validateAndResolveUrl("https://example.com/path?q=1"));
    }
}
