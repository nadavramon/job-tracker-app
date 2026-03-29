package com.nadavramon.job_tracker.exception;

import org.springframework.http.HttpStatus;

public class AiServiceException extends RuntimeException {

    private final HttpStatus httpStatus;

    public AiServiceException(HttpStatus httpStatus, String message) {
        super(message);
        this.httpStatus = httpStatus;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}
