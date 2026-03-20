package com.nadavramon.job_tracker.config;

import com.nadavramon.job_tracker.service.RefreshTokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Profile("!test")
public class RefreshTokenPurgeScheduler {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenPurgeScheduler.class);

    private final RefreshTokenService refreshTokenService;

    public RefreshTokenPurgeScheduler(RefreshTokenService refreshTokenService) {
        this.refreshTokenService = refreshTokenService;
    }

    @Scheduled(cron = "0 0 3 * * *")
    public void purgeExpiredTokens() {
        log.info("Purging expired refresh tokens");
        refreshTokenService.deleteExpiredTokens();
        log.info("Expired refresh token purge complete");
    }
}
