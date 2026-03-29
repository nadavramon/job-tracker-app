package com.nadavramon.job_tracker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nadavramon.job_tracker.dto.AiExtractResponse;
import com.nadavramon.job_tracker.exception.AiServiceException;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.InetAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.UnknownHostException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AiExtractionService {

    private static final Logger log = LoggerFactory.getLogger(AiExtractionService.class);

    private static final int MAX_FETCH_BYTES = 1_024_000;
    private static final Duration FETCH_TIMEOUT = Duration.ofSeconds(10);

    private static final String SYSTEM_PROMPT = """
            You are a job posting data extractor. Extract structured information from job posting text.
            Rules:
            - If a field cannot be determined, set it to null.
            - For jobType: full-time/permanent → FULL_TIME, part-time → PART_TIME, contract/freelance → CONTRACT, internship/co-op → INTERNSHIP.
            - For websiteLink: extract the careers/application URL if present, otherwise null.
            - For location: include city and state/country. If remote, include "Remote".""";

    private static final Map<String, Object> TOOL_SCHEMA = Map.of(
            "type", "object",
            "properties", Map.of(
                    "companyName", Map.of("type", "string", "description", "Company name"),
                    "jobRole", Map.of("type", "string", "description", "Job title/role"),
                    "location", Map.of("type", "string", "description", "Job location"),
                    "jobType", Map.of("type", "string", "enum", List.of("FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"), "description", "Employment type"),
                    "websiteLink", Map.of("type", "string", "description", "Application/careers URL")
            ),
            "required", List.of()
    );

    private final UserService userService;
    private final ObjectMapper objectMapper;
    private final RestClient anthropicClient;
    private final RestClient urlFetchClient;
    private final String model;
    private final int maxTokens;
    private final int maxRequests;
    private final ConcurrentHashMap<String, Bucket> rateLimitBuckets = new ConcurrentHashMap<>();

    @Autowired
    public AiExtractionService(
            UserService userService,
            @Value("${ai.anthropic.api-url:https://api.anthropic.com/v1/messages}") String apiUrl,
            @Value("${ai.anthropic.model:claude-sonnet-4-6}") String model,
            @Value("${ai.anthropic.max-tokens:512}") int maxTokens,
            @Value("${ai.rate-limit.max-requests:15}") int maxRequests) {
        this.userService = userService;
        this.objectMapper = new ObjectMapper();
        this.model = model;
        this.maxTokens = maxTokens;
        this.maxRequests = maxRequests;
        this.anthropicClient = RestClient.builder()
                .baseUrl(apiUrl)
                .build();
        this.urlFetchClient = RestClient.builder()
                .build();
    }

    // Package-private constructor for testing
    AiExtractionService(
            UserService userService,
            ObjectMapper objectMapper,
            RestClient anthropicClient,
            RestClient urlFetchClient,
            String model,
            int maxTokens,
            int maxRequests) {
        this.userService = userService;
        this.objectMapper = objectMapper;
        this.anthropicClient = anthropicClient;
        this.urlFetchClient = urlFetchClient;
        this.model = model;
        this.maxTokens = maxTokens;
        this.maxRequests = maxRequests;
    }

    public AiExtractResponse extract(String text) {
        String apiKey = userService.getUserApiKey();
        if (apiKey == null) {
            throw new AiServiceException(HttpStatus.BAD_REQUEST,
                    "Anthropic API key not configured. Add your key in Settings.");
        }

        enforceRateLimit();

        String processedText = text.trim();
        String sourceUrl = null;

        if (processedText.startsWith("http://") || processedText.startsWith("https://")) {
            sourceUrl = processedText;
            processedText = fetchAndStripHtml(processedText);
            if (processedText.isEmpty()) {
                throw new AiServiceException(HttpStatus.BAD_REQUEST,
                        "Could not extract text from URL.");
            }
            if (processedText.length() > 50_000) {
                processedText = processedText.substring(0, 50_000);
            }
        }

        return callAnthropic(apiKey, processedText, sourceUrl);
    }

    private void enforceRateLimit() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Bucket bucket = rateLimitBuckets.computeIfAbsent(username, k -> Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(maxRequests)
                        .refillGreedy(maxRequests, Duration.ofMinutes(1))
                        .build())
                .build());

        if (!bucket.tryConsume(1)) {
            throw new AiServiceException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many requests. Please wait a moment.");
        }
    }

    String fetchAndStripHtml(String url) {
        URI safeUri = validateAndResolveUrl(url);

        try {
            String html = urlFetchClient.get()
                    .uri(safeUri)
                    .header("User-Agent", "Mozilla/5.0 (compatible; JobTracker/1.0)")
                    .header("Host", URI.create(url).getHost())
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

    URI validateAndResolveUrl(String url) {
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

        // Resolve hostname and validate the resolved IP to prevent DNS rebinding.
        // Then build a URI with the resolved IP so the HTTP client connects directly
        // to the validated address, closing the TOCTOU window.
        InetAddress resolvedAddr = resolveAndValidate(host);
        try {
            return new URI(scheme, null, resolvedAddr.getHostAddress(),
                    port == -1 ? (scheme.equals("https") ? 443 : 80) : port,
                    uri.getPath(), uri.getQuery(), null);
        } catch (Exception e) {
            throw new AiServiceException(HttpStatus.BAD_REQUEST, "Invalid URL.");
        }
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

        // Check IPv4 private ranges
        String[] parts = host.split("\\.");
        if (parts.length == 4) {
            try {
                int a = Integer.parseInt(parts[0]);
                int b = Integer.parseInt(parts[1]);
                if (a == 127) return true;                          // 127.0.0.0/8
                if (a == 10) return true;                           // 10.0.0.0/8
                if (a == 172 && b >= 16 && b <= 31) return true;   // 172.16.0.0/12
                if (a == 192 && b == 168) return true;              // 192.168.0.0/16
                if (a == 169 && b == 254) return true;              // 169.254.0.0/16
                if (a == 0) return true;                            // 0.0.0.0/8
            } catch (NumberFormatException e) {
                // Not a valid IPv4 — fall through to DNS resolution
            }
        }

        return false;
    }

    private AiExtractResponse callAnthropic(String apiKey, String text, String sourceUrl) {
        String userMessage = sourceUrl != null
                ? "Source URL: " + sourceUrl + "\n\nJob posting text:\n" + text
                : text;

        Map<String, Object> tool = Map.of(
                "name", "extract_job_posting",
                "description", "Extract structured job posting information",
                "input_schema", TOOL_SCHEMA
        );

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "max_tokens", maxTokens,
                "system", SYSTEM_PROMPT,
                "messages", List.of(Map.of("role", "user", "content", userMessage)),
                "tools", List.of(tool),
                "tool_choice", Map.of("type", "tool", "name", "extract_job_posting")
        );

        try {
            String responseJson = anthropicClient.post()
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            return parseAnthropicResponse(responseJson);
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode().value() == 401) {
                throw new AiServiceException(HttpStatus.BAD_GATEWAY,
                        "Invalid API key. Please check your key in Settings.");
            }
            if (e.getStatusCode().value() == 429) {
                throw new AiServiceException(HttpStatus.TOO_MANY_REQUESTS,
                        "AI service is rate limited. Please try again shortly.");
            }
            throw new AiServiceException(HttpStatus.BAD_GATEWAY,
                    "AI service returned an error.");
        } catch (HttpServerErrorException e) {
            throw new AiServiceException(HttpStatus.BAD_GATEWAY,
                    "AI service is temporarily unavailable.");
        } catch (RestClientException e) {
            throw new AiServiceException(HttpStatus.BAD_GATEWAY,
                    "Failed to connect to AI service.");
        }
    }

    private AiExtractResponse parseAnthropicResponse(String responseJson) {
        try {
            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode content = root.get("content");

            if (content == null || !content.isArray()) {
                throw new AiServiceException(HttpStatus.BAD_GATEWAY, "Unexpected AI response format.");
            }

            for (JsonNode block : content) {
                if ("tool_use".equals(block.path("type").asText())) {
                    JsonNode input = block.get("input");
                    if (input != null) {
                        return objectMapper.treeToValue(input, AiExtractResponse.class);
                    }
                }
            }

            throw new AiServiceException(HttpStatus.BAD_GATEWAY, "AI did not return extraction results.");
        } catch (AiServiceException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to parse Anthropic response", e);
            throw new AiServiceException(HttpStatus.BAD_GATEWAY, "Failed to parse AI response.");
        }
    }
}
