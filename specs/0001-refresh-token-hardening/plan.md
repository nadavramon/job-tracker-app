# Refresh-token subsystem backend hardening — Implementation Plan

> Executed by /forge:implement task-by-task. Checkbox state belongs to the orchestrator only.

**Goal:** Fix three interlocking refresh-token defects (theft-revocation rollback, dead optimistic-lock catch, missing `version` column) so reuse detection actually persists, concurrent refresh returns 401 not 500, and the `@Version` column syncs on a populated table — each pinned by a Testcontainers integration test that fails against the current code.

**Architecture:** Backend-only. Three small source edits in the refresh-token subsystem plus two new `@SpringBootTest` + Testcontainers integration-test classes. No new endpoints, DTOs, or frontend changes. Tests run against an ephemeral `postgres:17` container (Docker in CI + local), the first live-DB tests in the suite.

**Stack:** Spring Boot 4.0.1, Spring Data JPA / Hibernate, JUnit 5, Testcontainers (`org.testcontainers:postgresql`, version managed by the Spring Boot BOM), `@ServiceConnection` for datasource wiring.

## File map

| File | Action | Responsibility |
|---|---|---|
| `backend/pom.xml` | modify | Add 3 test deps (BOM-managed): `spring-boot-testcontainers`, `org.testcontainers:junit-jupiter`, `org.testcontainers:postgresql` |
| `backend/src/main/java/com/nadavramon/job_tracker/entity/RefreshToken.java` | modify | Add `@ColumnDefault("0")` to `version` field (Fix 3) |
| `backend/src/main/java/com/nadavramon/job_tracker/service/RefreshTokenService.java` | modify | `noRollbackFor` (Fix 1); `saveAndFlush` + correct catch type (Fix 2) |
| `backend/src/test/java/com/nadavramon/job_tracker/service/RefreshTokenRotationIT.java` | create | Test A (theft persists) + Test B (concurrent → 401) against real Postgres |
| `backend/src/test/java/com/nadavramon/job_tracker/service/RefreshTokenVersionColumnMigrationIT.java` | create | Test C: ddl-auto=update adds `version` to a pre-populated legacy table |

---

### Task 1: Testcontainers infrastructure + IT scaffold

**Files:**
- Modify: `backend/pom.xml`
- Create: `backend/src/test/java/com/nadavramon/job_tracker/service/RefreshTokenRotationIT.java`

- [x] **Step 1: Add the three test dependencies** to `backend/pom.xml`, after the existing `spring-boot-starter-test` dependency (line 78). All versions are managed by the Spring Boot 4.0.1 BOM — no explicit `<version>`. `postgresql` alone does **not** transitively provide `@Testcontainers`/`@Container` (needs `junit-jupiter`) or `@ServiceConnection` (needs `spring-boot-testcontainers`); without all three the IT classes fail to compile:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-testcontainers</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <scope>test</scope>
</dependency>
```
- [x] **Step 2: Create the IT scaffold** with a container, helpers, and a context-load sanity test:
```java
package com.nadavramon.job_tracker.service;

import com.nadavramon.job_tracker.entity.RefreshToken;
import com.nadavramon.job_tracker.entity.User;
import com.nadavramon.job_tracker.enums.ThemePreference;
import com.nadavramon.job_tracker.repository.RefreshTokenRepository;
import com.nadavramon.job_tracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@Testcontainers
class RefreshTokenRotationIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17");

    @Autowired
    RefreshTokenService refreshTokenService;
    @Autowired
    RefreshTokenRepository refreshTokenRepository;
    @Autowired
    UserRepository userRepository;

    // The ITs are not @Transactional (we need commits to be observable), so wipe state between
    // methods. Order matters: refresh_tokens has an FK to users.
    @BeforeEach
    void cleanSlate() {
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void contextLoadsAgainstRealPostgres() {
        assertNotNull(refreshTokenService);
    }

    User persistUser() {
        User u = new User();
        u.setEmail("it-" + UUID.randomUUID() + "@test.com");
        u.setUsername("it-" + UUID.randomUUID());
        u.setPassword("hashed-irrelevant");
        u.setThemePreference(ThemePreference.SYSTEM);
        return userRepository.save(u);
    }

    RefreshToken persistToken(User user, UUID familyId, String token, boolean revoked) {
        RefreshToken t = new RefreshToken();
        t.setToken(token);
        t.setFamilyId(familyId);
        t.setUser(user);
        t.setExpiresAt(Instant.now().plus(Duration.ofDays(7)));
        t.setRevoked(revoked);
        t.setCreatedAt(Instant.now());
        return refreshTokenRepository.save(t);
    }
}
```
- [x] **Step 3: Run it, verify it passes** — `cd backend && ./mvnw test -Dtest=RefreshTokenRotationIT` → PASS: `Tests run: 1, Failures: 0, Errors: 0` against Postgres 17.10.
- [x] **Step 4: Commit** — done: `bf17a23`

---

### Task 2: Fix 1 — theft revocation persists

**Files:**
- Modify: `backend/src/test/java/com/nadavramon/job_tracker/service/RefreshTokenRotationIT.java`
- Modify: `backend/src/main/java/com/nadavramon/job_tracker/service/RefreshTokenService.java`

- [x] **Step 1: Write the failing test** — add to `RefreshTokenRotationIT` (and imports `TokenTheftException`, `org.junit.jupiter.api.Assertions.*`):
```java
@Test
void theftDetection_revokesEntireFamily_andPersistsDespiteException() {
    User user = persistUser();
    UUID familyId = UUID.randomUUID();
    // 'stolen' token was already rotated once, so it is revoked; a live descendant exists in the same family.
    persistToken(user, familyId, "stolen-token", true);
    persistToken(user, familyId, "live-descendant", false);

    assertThrows(TokenTheftException.class,
            () -> refreshTokenService.rotateRefreshToken("stolen-token"));

    // Fresh read in a new transaction: the family revocation must have COMMITTED.
    RefreshToken descendant = refreshTokenRepository.findByToken("live-descendant").orElseThrow();
    assertTrue(descendant.isRevoked(),
            "family revocation must persist despite the TokenTheftException rollback");
}
```
- [x] **Step 2: Run it, verify it fails** → FAIL captured: `family revocation must persist ... expected: <true> but was: <false>`.
- [x] **Step 3: Minimal implementation** — in `RefreshTokenService.java`, change the annotation on `rotateRefreshToken` (line 47) and add the invariant comment:
```java
    // noRollbackFor: on theft detection we revoke the family and then throw; without this,
    // the throw rolls back the revocation. Safe ONLY because the theft branch performs no
    // other write before the throw. If you add a pre-throw write, revisit this.
    @Transactional(noRollbackFor = TokenTheftException.class)
    public RotationResult rotateRefreshToken(String tokenValue) {
```
(No import change — `TokenTheftException` is already imported.)
- [x] **Step 4: Run it, verify it passes** → PASS: `Tests run: 1, Failures: 0, Errors: 0`.
- [x] **Step 5: Commit** — done: `01e1eb5`

---

### Task 3: Fix 2 — concurrent rotation returns 401, not 500

**Files:**
- Modify: `backend/src/test/java/com/nadavramon/job_tracker/service/RefreshTokenRotationIT.java`
- Modify: `backend/src/main/java/com/nadavramon/job_tracker/service/RefreshTokenService.java`

- [x] **Step 1: Write the failing test** — add to `RefreshTokenRotationIT` (imports: `InvalidCredentialsException`, `java.util.List`, `java.util.concurrent.*`):
```java
@Test
void concurrentRotation_oneSucceeds_otherGets401_never500() throws Exception {
    User user = persistUser();
    persistToken(user, UUID.randomUUID(), "shared-token", false);

    CyclicBarrier barrier = new CyclicBarrier(2);
    ExecutorService pool = Executors.newFixedThreadPool(2);
    Callable<Object> task = () -> {
        barrier.await();
        try {
            return refreshTokenService.rotateRefreshToken("shared-token");
        } catch (Exception e) {
            return e;
        }
    };
    Future<Object> f1 = pool.submit(task);
    Future<Object> f2 = pool.submit(task);
    List<Object> outcomes = List.of(f1.get(10, TimeUnit.SECONDS), f2.get(10, TimeUnit.SECONDS));
    pool.shutdownNow();

    long successes = outcomes.stream()
            .filter(o -> o instanceof RefreshTokenService.RotationResult).count();
    assertEquals(1, successes, "exactly one concurrent rotation should succeed");

    Object failure = outcomes.stream().filter(o -> o instanceof Exception).findFirst().orElseThrow();
    assertTrue(failure instanceof InvalidCredentialsException || failure instanceof TokenTheftException,
            "the losing rotation must map to a 401-class exception, not a 500; got: " + failure.getClass());

    // No-leak invariant: the loser's transaction rolled back, so only the winner's new token was
    // added (original now-revoked + 1 new = 2). @BeforeEach guarantees a clean slate.
    assertEquals(2, refreshTokenRepository.count(),
            "the losing rotation must not persist a new token");
}
```
- [x] **Step 2: Run it, verify it fails** → FAIL captured: `got: class org.springframework.orm.ObjectOptimisticLockingFailureException` (uncaught, 500-class). Barrier produced the version-conflict path first try.
- [x] **Step 3: Minimal implementation** — two edits in `RefreshTokenService.java`:
  1. Swap the catch type and imports. Remove `import jakarta.persistence.OptimisticLockException;`, add `import org.springframework.orm.ObjectOptimisticLockingFailureException;`. Change lines 49-53:
```java
        try {
            return doRotate(tokenValue);
        } catch (ObjectOptimisticLockingFailureException e) {
            throw new InvalidCredentialsException("Token already used");
        }
```
  2. Force the version check to surface inside `doRotate` (so it is inside the try's dynamic scope). Change line 84 `refreshTokenRepository.save(existingToken);` to:
```java
        refreshTokenRepository.saveAndFlush(existingToken);
```
- [x] **Step 4: Run it, verify it passes** → PASS 3/3 consecutive runs (non-flaky); full class 3 tests green.
- [x] **Step 5: Commit** — done: `5149538`

---

### Task 4: Fix 3 — version column syncs on a populated table

**Files:**
- Create: `backend/src/test/java/com/nadavramon/job_tracker/service/RefreshTokenVersionColumnMigrationIT.java`
- Modify: `backend/src/main/java/com/nadavramon/job_tracker/entity/RefreshToken.java`

- [x] **Step 1: Write the failing test** — create `RefreshTokenVersionColumnMigrationIT.java`. It pre-seeds a legacy `refresh_tokens` (no `version` column) with one row BEFORE the context boots, forcing Hibernate `ddl-auto=update` to `ALTER` a populated table:
```java
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
                    )""");   // <-- deliberately NO `version` column (the prod drift state)
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
```
- [x] **Step 2: Run it, verify it fails** → FAIL captured: `Error executing DDL "alter table if exists refresh_tokens add column version integer not null" ... column "version" ... contains null values`; column not added → test errors on `column "version" does not exist`.
- [x] **Step 3: Minimal implementation** — in `RefreshToken.java`, add the import `import org.hibernate.annotations.ColumnDefault;` and annotate the field (lines 37-38):
```java
    @Version
    @ColumnDefault("0")
    private int version;
```
- [x] **Step 4: Run it, verify it passes** → PASS: `Tests run: 1, Failures: 0, Errors: 0`; legacy row reads version 0.
- [x] **Step 5: Commit** — done: `d5ac9b0`

---

### Task 5: Full verification gauntlet (mirrors CI)

**Files:** none (verification only)

- [x] **Step 1: Backend gauntlet** → `BUILD SUCCESS`. Surefire 191 run / 0 fail / 0 err; Failsafe ITs run (RefreshTokenRotationIT 3, RefreshTokenVersionColumnMigrationIT 1) all green; `JobTrackerApplicationTests` still the only `@Disabled`. (Failsafe wiring was Deviation — ITs did not run before.)
- [x] **Step 2: Frontend gauntlet** → lint 0, `Test Suites: 41 passed`, `Tests: 375 passed`, build `Compiled successfully`. Unchanged from baseline.
- [x] **Step 3: red→green evidence** — captured per-fix in each task's Step 2/4 above and in `## Deviations`; carry into the PR body.
- [x] **Step 4: Commit** — failsafe + test fix `d5ac9b0`→ committed; backend tree clean (`git status` shows only PILOT-NOTES.md + specs/).

---

## Deviations

Post-approval reality diverging from the frozen plan (Constitution Article II — logged, never silent).

- **Task 1 — Testcontainers 2.0 artifact coordinates.** The plan (and plan-reviewer) assumed `org.testcontainers:junit-jupiter` / `:postgresql` with BOM-managed versions. Spring Boot 4.0.1 manages **Testcontainers 2.0.3**, which renamed every module with a `testcontainers-` prefix. Correct BOM-managed coordinates: `org.testcontainers:testcontainers-junit-jupiter` and `org.testcontainers:testcontainers-postgresql`. The `org.testcontainers.containers` / `org.testcontainers.junit.jupiter` packages are unchanged, so the test code compiles as-written. *Why:* dependency-version reality only observable at build time; caught on the first `./mvnw test`.
- **Task 1 — test `application.properties` completeness.** The plan assumed the sparse `src/test/resources/application.properties` inherits missing keys from `src/main/resources/application.properties`. It does not — same-named classpath resources **shadow** (test wins, main is not loaded/merged), and the existing suite never exposed this because every prior test is a `@WebMvcTest` slice, not a full `@SpringBootTest`. The first full-context IT fails on unresolved `cors.allowed-origins`. *Resolution:* add the three keys the full context needs and the sparse file lacked — `cookie.secure=false`, `cors.allowed-origins=http://localhost:3000`, `spring.jpa.hibernate.ddl-auto=update` — to the shared test properties (the correct home; `@WebMvcTest` slices are unaffected, and `AuthControllerTest`'s `@TestPropertySource` override still wins). *Why:* the shadow-vs-merge behavior was a wrong assumption in both the plan and the plan-review; harmless in the plan, exposed at runtime.
  - File map addendum: `backend/src/test/resources/application.properties` — modify (add the 3 keys above).
- **Task 5 — existing unit test coupled to `save()` call count.** `RefreshTokenServiceTest.rotateRefreshToken_Success_ReturnsNewTokenAndRevokesOld:83` asserted `verify(times(2)).save(...)`. Fix 2 changed the second `save(existingToken)` to `saveAndFlush`, so `save` is now called once and `saveAndFlush` once. *Resolution:* updated the assertion to `verify().save(...)` + `verify().saveAndFlush(...)`. *Why:* the unit test was coupled to an implementation detail the fix legitimately changed — exactly the brittleness the test-quality reviewer flagged. File map addendum: `backend/src/test/java/.../service/RefreshTokenServiceTest.java` — modify.
- **Task 5 — `*IT` tests never executed under `clean verify` (DoD-invalidating).** The plan and DoD assumed `./mvnw clean verify` runs the new `*IT` classes. It did not: surefire's default includes exclude `*IT`, and this pom had **no failsafe plugin** — so both ITs were silently skipped (`Tests run: 191`, unchanged) locally *and in CI*. The three fixes would have shipped with their integration tests never running. *Resolution:* added `maven-failsafe-plugin` (version BOM-managed) binding `integration-test` + `verify`, which runs `**/*IT.java` in the verify phase. *Why:* Maven's surefire/failsafe split is a real convention the plan overlooked; only the full gauntlet exposed it. File map addendum: `backend/pom.xml` — modify (add failsafe plugin). This is the single most important thing the gauntlet caught.
