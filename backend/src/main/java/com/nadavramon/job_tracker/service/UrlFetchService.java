package com.nadavramon.job_tracker.service;

import com.nadavramon.job_tracker.exception.AiServiceException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;

@Service
public class UrlFetchService {

    private static final int MAX_FETCH_BYTES = 1_024_000;

    private final RestClient restClient;

    public UrlFetchService() {
        this.restClient = RestClient.builder().build();
    }

    // Package-private constructor for testing
    UrlFetchService(RestClient restClient) {
        this.restClient = restClient;
    }

    public String fetchAndStripHtml(String url) {
        validateAndResolveUrl(url);

        try {
            String html = restClient.get()
                    .uri(URI.create(url))
                    .header("User-Agent", "Mozilla/5.0 (compatible; JobTracker/1.0)")
                    .retrieve()
                    .body(String.class);

            if (html == null) {
                throw new AiServiceException(HttpStatus.BAD_REQUEST, "No response body from URL.");
            }

            if (html.length() > MAX_FETCH_BYTES) {
                html = html.substring(0, MAX_FETCH_BYTES);
            }

            return html.replaceAll("<[^>]*>", " ").replaceAll("\\s+", " ").trim();
        } catch (AiServiceException e) {
            throw e;
        } catch (RestClientException e) {
            throw new AiServiceException(HttpStatus.BAD_REQUEST, "Failed to fetch the provided URL.");
        }
    }

    void validateAndResolveUrl(String url) {
        URI uri;
        try {
            uri = URI.create(url);
        } catch (IllegalArgumentException e) {
            throw new AiServiceException(HttpStatus.BAD_REQUEST, "Invalid URL.");
        }

        String scheme = uri.getScheme();
        if (scheme == null || (!scheme.equals("http") && !scheme.equals("https"))) {
            throw new AiServiceException(HttpStatus.BAD_REQUEST, "Only HTTP and HTTPS URLs are allowed.");
        }

        String host = uri.getHost();
        if (host == null) {
            throw new AiServiceException(HttpStatus.BAD_REQUEST, "Invalid URL.");
        }

        int port = uri.getPort();
        if (port != -1 && port != 80 && port != 443) {
            throw new AiServiceException(HttpStatus.BAD_REQUEST, "Only standard HTTP ports are allowed.");
        }

        if (isPrivateHost(host)) {
            throw new AiServiceException(HttpStatus.BAD_REQUEST, "URL points to a private or reserved address.");
        }

        resolveAndValidate(host);
    }

    private InetAddress resolveAndValidate(String host) {
        try {
            InetAddress addr = InetAddress.getByName(host);
            if (addr.isLoopbackAddress() || addr.isLinkLocalAddress() ||
                    addr.isSiteLocalAddress() || addr.isAnyLocalAddress()) {
                throw new AiServiceException(HttpStatus.BAD_REQUEST,
                        "URL points to a private or reserved address.");
            }
            return addr;
        } catch (UnknownHostException e) {
            throw new AiServiceException(HttpStatus.BAD_REQUEST, "Could not resolve hostname.");
        }
    }

    boolean isPrivateHost(String host) {
        if ("localhost".equals(host) || "[::1]".equals(host)) {
            return true;
        }

        String cleanHost = host.replaceAll("^\\[|]$", "");
        if ("::1".equals(cleanHost) || cleanHost.startsWith("fe80:") ||
                cleanHost.startsWith("fc") || cleanHost.startsWith("fd")) {
            return true;
        }

        String[] parts = host.split("\\.");
        if (parts.length == 4) {
            try {
                int a = Integer.parseInt(parts[0]);
                int b = Integer.parseInt(parts[1]);
                if (a == 127) return true;
                if (a == 10) return true;
                if (a == 172 && b >= 16 && b <= 31) return true;
                if (a == 192 && b == 168) return true;
                if (a == 169 && b == 254) return true;
                if (a == 0) return true;
            } catch (NumberFormatException e) {
                // Not a valid IPv4 — fall through to DNS resolution
            }
        }

        return false;
    }
}
