---
feature: refresh-token-hardening
status: verified
created: 2026-07-06
---

# Refresh-token subsystem backend hardening — Spec

## Problem

The refresh-token rotation subsystem has three interlocking defects that make its reuse-detection security feature effectively non-functional in production, and can 500 legitimate refreshes. All three were confirmed by reading the source; none is caught by the current test suite because every existing test mocks the repository, so real transaction and optimistic-locking semantics never engage.

1. **Theft revocation rolls itself back.** `RefreshTokenService.rotateRefreshToken` is `@Transactional`. On reuse detection, `doRotate` calls `refreshTokenRepository.revokeByFamilyId(...)` (which joins the same transaction) and then throws `TokenTheftException`, a `RuntimeException`. The throw triggers a Spring transaction rollback that **undoes the family revocation**. Net effect: after "theft detected" is logged and the victim gets a 401, the attacker's live descendant token is never revoked and keeps working indefinitely — the core security control never persists.
2. **The concurrent-rotation guard is dead code.** The `catch (jakarta.persistence.OptimisticLockException)` in `rotateRefreshToken` can never fire, for two independent reasons: (a) Spring translates optimistic-lock conflicts to `org.springframework.orm.ObjectOptimisticLockingFailureException`, which does **not** extend `jakarta.persistence.OptimisticLockException`; and (b) `save()` does not flush, so the version conflict surfaces at commit — *after* the method returns, outside the `try`. A simultaneous double-rotate therefore falls through to the global handler as a 500 instead of the intended 401.
3. **The `@Version` column is missing from the production database.** `RefreshToken.version` is a primitive `int` annotated `@Version`, which Hibernate maps as `NOT NULL` with no default. Under `spring.jpa.hibernate.ddl-auto=update`, Hibernate cannot `ADD COLUMN version int NOT NULL` to the already-populated `refresh_tokens` table, so it silently skips the column. Without the column, optimistic locking cannot engage at all (defeating fix 2's premise), and any code path that relies on `@Version` risks a runtime SQL error.

## Goals

- Family revocation on theft detection **persists** to the database and survives the `TokenTheftException`.
- Two concurrent rotations of the same refresh token resolve to exactly **one success and one `401`** (`InvalidCredentialsException`), never a `500`.
- The `refresh_tokens.version` column is created by `ddl-auto=update` even on a pre-existing populated table, so optimistic locking is actually active.
- Each fix is pinned by an integration test that runs against a real Postgres and **fails against the current code**, proving the regression guard is real.

## Non-goals (out of scope)

- The multi-tab frontend refresh race (two tabs both rotating the single-use token → spurious "session ended" logout). Deferred to the later frontend data-fetching spec.
- Introducing migration tooling (Flyway/Liquibase). Chose `@ColumnDefault` instead; `ddl-auto=update` is retained. A future spec may revisit migration tooling to eliminate the drift class generally.
- All other Phase-0 review findings (SSRF, ownership oracle, stats aggregation, dead code, etc.) — each has its own later spec.
- Any frontend change. This spec touches backend only; the frontend suite is run solely to prove no cross-stack breakage.

## Design

Behavior-changing bug fix. Three source edits plus a new Testcontainers integration-test class.

**Fix 1 — theft revocation persists.** Change the annotation on `rotateRefreshToken` from `@Transactional` to `@Transactional(noRollbackFor = TokenTheftException.class)`. When `TokenTheftException` propagates, the transaction commits instead of rolling back, so the `revokeByFamilyId` UPDATE persists; the exception still propagates to the controller and yields a 401. This is safe **only** because the theft branch performs no writes other than the revocation — a code comment will record that constraint so a future edit that adds a pre-throw write does not silently commit it.

**Fix 2 — concurrent rotation returns 401, not 500.** Two edits in **two different methods**; the `try/catch` stays where it is today, in `rotateRefreshToken`, and must remain the caller of `doRotate` so the flush below executes within its dynamic scope:
- **In `doRotate`:** change the final `refreshTokenRepository.save(existingToken)` to `saveAndFlush(existingToken)`. Flushing forces the optimistic `UPDATE ... SET revoked=true, version=version+1 WHERE id=? AND version=?` to execute *while `doRotate` is still on the stack* — i.e. inside the `rotateRefreshToken` try block that wraps the `doRotate(tokenValue)` call. The losing concurrent transaction matches 0 rows and Hibernate raises the conflict there, where the catch can see it.
- **In `rotateRefreshToken` (the existing try/catch):** change `catch (jakarta.persistence.OptimisticLockException e)` to `catch (org.springframework.orm.ObjectOptimisticLockingFailureException e)`, still mapping to `throw new InvalidCredentialsException("Token already used")` (→ 401). Update imports: remove `jakarta.persistence.OptimisticLockException`, add `org.springframework.orm.ObjectOptimisticLockingFailureException`.

Do **not** move the catch into `doRotate` or move the `saveAndFlush` out of `doRotate`: either change puts the conflict outside the try's dynamic scope and the 500 returns.

**Fix 3 — version column syncs.** Add `@ColumnDefault("0")` (`org.hibernate.annotations.ColumnDefault`) to the `version` field of `RefreshToken`. Hibernate's `ddl-auto=update` then generates `ADD COLUMN version integer DEFAULT 0`, which Postgres accepts on a populated table (existing rows get 0). `ddl-auto` remains `update`; no properties change.

**Data flow / error handling.** No new endpoints or DTOs. The rotation flow is unchanged for the happy path. Changed error paths: theft → 401 with revocation persisted; concurrent double-rotate → 401. Both are already mapped by `GlobalExceptionHandler` (`TokenTheftException` and `InvalidCredentialsException`).

**Test infrastructure.** Add `org.testcontainers:postgresql` at test scope. A new integration-test class boots `@SpringBootTest` against an ephemeral `postgres:17` container wired via `@DynamicPropertySource` (or `@ServiceConnection`), identical locally and in CI (both have Docker). This is the first live-DB test in the suite; `JobTrackerApplicationTests` remains `@Disabled` and is unaffected. The IT inherits `jwt.secret` / `jwt.expiration` / `encryption.secret` from the existing `src/test/resources/application.properties`, and `ddl-auto=update` from the main properties, so it is green locally with no manual env — Testcontainers supplies only the datasource URL/credentials.

## Interfaces & contracts

No public interface changes. Signatures preserved:
- `RefreshTokenService.rotateRefreshToken(String) : RotationResult` — same signature; annotation attribute added; concurrent-conflict now yields `InvalidCredentialsException` (was effectively `500`).
- `RefreshToken.version` — field gains `@ColumnDefault("0")`; type and accessors unchanged.
- `doRotate` — private; internal `save` → `saveAndFlush` and catch-type swap only.

New test artifacts (names indicative, finalized in the plan):
- `RefreshTokenRotationIT` (`src/test/java/.../service/`) — `@SpringBootTest` + Testcontainers.
- `pom.xml` — `org.testcontainers:postgresql` (test scope; version via the Testcontainers BOM or Spring Boot's managed version).

## Risks

- **Testcontainers requires Docker.** GitHub Actions `ubuntu-latest` provides it; local Docker confirmed running. If Docker were unavailable the ITs would error (not silently skip), which is the desired fail-loud behavior. → Mitigation: none needed; documented so a Docker-less environment produces an obvious failure, not a false green.
- **`noRollbackFor` commits the entire transaction on `TokenTheftException`.** Correct only while the theft branch writes nothing but the revocation. → Mitigation: inline code comment stating the invariant; the theft-path IT (Test A) asserts exactly the family-revocation outcome, so a regression is caught.
- **Test C fidelity.** A fresh Testcontainers DB creates the table *with* `version`, so it cannot reproduce the populated-table failure by default. → Mitigation: Test C explicitly creates a legacy `refresh_tokens` (no `version` column) via JDBC, inserts a row, then triggers a Hibernate schema update and asserts the column was added with default 0 and the existing row reads 0 — reproducing the real prod drift.
- **`saveAndFlush` changes flush timing.** It flushes the whole persistence context (including the new-token insert) mid-method. Reviewed: the only pending writes are the new-token insert and the existing-token update, both intended to persist; on conflict the transaction rolls back and nothing leaks. → Mitigation: Test B asserts the loser persists no new token.

## Verification (Definition of Done)

<!-- MANDATORY. Runnable commands with expected outcomes. /forge:verify executes these literally. -->

- [ ] `cd backend && ./mvnw clean verify` → `BUILD SUCCESS`; the new `RefreshTokenRotationIT` (Tests A/B/C) runs green; `JobTrackerApplicationTests` remains the only `@Disabled` test. Test count = **191 prior (190 pass + 1 `@Disabled`) + the new ITs**, all passing.
- [ ] Test B (Fix 2): concurrent rotation of one token yields exactly one success and one 401-class exception (`InvalidCredentialsException` **or** `TokenTheftException`, depending on commit-order interleaving — both map to 401) — asserted in-test; no `ObjectOptimisticLockingFailureException` / 500 escapes, and the losing rotation persists no new token.
- [ ] Test C (Fix 3): a legacy `refresh_tokens` created without `version`, populated with one row, then schema-updated, ends with a `version` column defaulting to 0 and the existing row reading 0.
- [ ] `cd frontend && npm run lint && npm test && npm run build` → unchanged green (no frontend files modified), mirroring CI's frontend gauntlet (lint → test → build) as a cross-stack safety check per Constitution Article V.

**Red→green evidence (captured during `/forge:implement`, not re-derived at verify).** `git stash` cannot reproduce "red" once the fixes are committed, so the proof is a one-time implement-phase artifact: before applying each source fix, run the corresponding new test against the parent commit (or a worktree at it) and capture the failure, then capture the pass after the fix. Paste both into the implement-phase log / PR description:
- Test A against un-fixed `rotateRefreshToken` → **fails** (family not revoked in DB after `TokenTheftException`); with `noRollbackFor` → **passes**.
- Test B against the dead `jakarta` catch → **fails** (500 / `ObjectOptimisticLockingFailureException` escapes); with the flush + Spring-type catch → **passes**.
- Test C against `int version` without `@ColumnDefault` → **fails** (column not added to the populated table); with `@ColumnDefault("0")` → **passes**.
