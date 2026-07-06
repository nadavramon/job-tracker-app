package com.nadavramon.job_tracker.service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Testcontainers
class RefreshTokenVersionColumnMigrationIT {

    static final UUID USER_ID = UUID.randomUUID();

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17");

    @DynamicPropertySource
    static void datasourceAndLegacySeed(DynamicPropertyRegistry registry) throws Exception {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);

        // Create a LEGACY schema (refresh_tokens WITHOUT the version column) and populate one row,
        // BEFORE Spring/Hibernate boots. ddl-auto=update must then ALTER a non-empty table.
        try (Connection c = DriverManager.getConnection(
                     postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
             Statement s = c.createStatement()) {
            s.execute("""
                    CREATE TABLE users (
                        id uuid PRIMARY KEY,
                        email varchar(255) UNIQUE NOT NULL,
                        username varchar(255) UNIQUE NOT NULL,
                        password varchar(255) NOT NULL,
                        anthropic_api_key varchar(255),
                        theme_preference varchar(255) NOT NULL,
                        created_at timestamp(6) with time zone NOT NULL,
                        updated_at timestamp(6) with time zone,
                        deleted_at timestamp(6)
                    )""");
            s.execute("""
                    CREATE TABLE refresh_tokens (
                        id uuid PRIMARY KEY,
                        token varchar(255) UNIQUE NOT NULL,
                        family_id uuid NOT NULL,
                        user_id uuid NOT NULL REFERENCES users(id),
                        expires_at timestamp(6) with time zone NOT NULL,
                        revoked boolean NOT NULL,
                        created_at timestamp(6) with time zone NOT NULL,
                        replaced_by_id uuid
                    )""");   // deliberately NO `version` column (the prod drift state)
            s.execute("INSERT INTO users (id, email, username, password, theme_preference, created_at) "
                    + "VALUES ('" + USER_ID + "', 'legacy@test.com', 'legacy-user', 'x', 'SYSTEM', now())");
            s.execute("INSERT INTO refresh_tokens (id, token, family_id, user_id, expires_at, revoked, created_at) "
                    + "VALUES ('" + UUID.randomUUID() + "', 'legacy-token', '" + UUID.randomUUID()
                    + "', '" + USER_ID + "', now() + interval '7 days', false, now())");
        }
    }

    @Test
    void ddlAutoUpdate_addsVersionColumnWithDefaultToPopulatedTable() throws Exception {
        // If the context reached this test, Hibernate successfully ALTERed the populated table.
        try (Connection c = DriverManager.getConnection(
                     postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
             Statement s = c.createStatement();
             ResultSet rs = s.executeQuery("SELECT version FROM refresh_tokens WHERE token = 'legacy-token'")) {
            assertTrue(rs.next(), "the pre-existing legacy row must survive the migration");
            assertEquals(0, rs.getInt("version"), "existing row must default to version 0");
        }
    }
}
