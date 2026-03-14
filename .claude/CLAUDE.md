# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack job application tracker. The backend is a Spring Boot REST API and the frontend is a Next.js app. They are two separate projects within the same monorepo.



## Progress Tracking

**Always read `.claude/progress.md` at the start of every session.** It contains:
- The current session state (active branch, in-progress files, next step)
- A full checklist of all subtasks with completion status
- Instructions for resuming work from a previous context window

## Workflow Discipline

**Always adhere to the strict stage-gating and checkpoint rules defined in `.claude/rules/workflow-discipline.md`.**
- Never auto-advance between stages without explicit user confirmation.
- Ensure Quality & Security awareness rules are met for both Frontend and Backend.

## Commands

### Backend (`/backend`)

```bash
# Run all tests with coverage (JaCoCo)
./mvnw clean verify

# Run a single test class
./mvnw test -Dtest=ApplicationControllerTest

# Start the server (http://localhost:8080)
./mvnw spring-boot:run
```

Backend requires these environment variables (or `application.properties` defaults):
- `DB_URL` — PostgreSQL JDBC URL (default: `jdbc:postgresql://localhost:5432/job_tracker`)
- `DB_USERNAME` / `DB_PASSWORD` — database credentials
- `JWT_SECRET` — secret key (min 32 chars)
- `JWT_EXPIRATION` — token TTL in ms (default: `86400000`)

Local overrides go in `application-local.properties` (gitignored, activated by `spring.profiles.active=local`).

### Frontend (`/frontend`)

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm run lint
npm test           # Jest (all tests)
npm run test:watch # Jest in watch mode
```

Frontend requires `NEXT_PUBLIC_API_URL` in `.env.local` (gitignored), set to `http://localhost:8080`.

## Architecture

### Backend

Spring Boot 4.0.1 / Java 21 / Spring Security (stateless JWT) / PostgreSQL 17.

**Request flow:** HTTP request → `JwtAuthenticationFilter` (extracts JWT from HttpOnly cookie, validates, sets `SecurityContext`) → Controller → Service → Repository.

Key packages under `com.nadavramon.job_tracker`:
- `config/` — `SecurityConfig` (CORS allows `localhost:3000`, `/auth/**` is public, CSRF disabled), `JwtAuthenticationFilter`, `RateLimitFilter`
- `controller/` — `AuthController` (`/auth/register`, `/auth/login`), `ApplicationController` (`/applications` CRUD)
- `service/` — `AuthService` (register + login by email or username), `ApplicationService` (full CRUD with ownership checks, resolves current user from `SecurityContext`), `JwtService` (JJWT 0.12.6)
- `entity/` — `User` (UUID PK, `@JsonIgnore` on password), `Application` (soft-delete via `@SQLRestriction("deleted_at IS NULL")`, stores portal credentials)
- `dto/` — request/response objects; `ApplicationRequest` supports partial updates (null fields ignored in the service layer for PATCH semantics)
- `enums/` — `Status` (APPLIED, SCREENING, INTERVIEWING, OFFER, REJECTED, WITHDRAWN), `JobType` (FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP)
- `exception/` — `GlobalExceptionHandler` (`@ControllerAdvice`) maps: `ResourceNotFoundException` → 404, `AccessDeniedException` → 403, `DuplicateResourceException` → 409, `InvalidCredentialsException` → 401, validation errors → 400
- `repository/` — `UserRepository` (findByEmail, findByUsername, existsByEmail, existsByUsername), `ApplicationRepository` (findByUser)

All `/applications` endpoints are user-scoped: the service fetches the authenticated user from the database and filters/validates ownership explicitly.

Soft delete: `deleteApplicationByUser` sets `deletedAt = now()` and saves; Hibernate automatically excludes these rows via the `@SQLRestriction` on the `Application` entity.

**Tests** live in `src/test/.../controller/` — `ApplicationControllerTest` (8 tests), `AuthControllerTest` (5 tests). Uses `@WebMvcTest` with `@MockitoBean` for services. CI uses a real PostgreSQL 17 service container.

### Frontend

Next.js 16 (App Router) / React 19 / TypeScript (strict) / Tailwind CSS v4 / Axios / Recharts.

**Auth flow:** JWT is delivered via HttpOnly cookie (set by the backend on login/register). The Axios instance in `lib/api.ts` uses `withCredentials: true` so the browser sends the cookie automatically. Session presence is tracked via `username` in `localStorage`. A response interceptor catches 401s globally and redirects to `/login?expired=true`.

Key directories:
- `app/` — Next.js App Router pages with two route groups: `(auth)/` for login/register (no sidebar) and `(app)/` for authenticated pages (with sidebar layout)
- `components/` — Custom-built UI components organized by feature: `layout/` (Sidebar, Header, MobileDrawer), `ui/` (Button, Input, Modal, Toast, Badge, Pagination, ConfirmDialog, etc.), `applications/` (ApplicationsTable, ApplicationCard, ApplicationForm, EditModal, RowActionMenu, StatusSelect, StatusHint, CredentialCell), `dashboard/` (stats, charts), `settings/`
- `context/` — React contexts: `ThemeContext` (light/dark/system), `ToastContext` (notification queue)
- `lib/` — `api.ts` (Axios with interceptors), `auth.ts` (username helpers, SSR-safe), `authService.ts`, `applicationService.ts`, `userService.ts`, `errorMessages.ts` (backend → friendly message mapping), `constants.ts` (shared UI constants e.g. `JOB_TYPE_LABELS`)
- `types/index.ts` — All TypeScript interfaces mirroring backend DTOs
- `__tests__/` — Jest + React Testing Library tests

The `@/` path alias resolves to the `frontend/` root (configured in `tsconfig.json` and `jest.config.mjs`).

## Coding Conventions

### Backend (Java)
- Constructor injection everywhere — no `@Autowired` annotations
- DTOs separate from entities — never expose JPA entities directly in API responses
- Validation via Jakarta Bean Validation annotations (`@NotBlank`, `@NotNull`, `@Email`, `@Size`) on DTO fields
- Custom runtime exceptions (extending `RuntimeException`) handled by `GlobalExceptionHandler`
- `ErrorResponse` DTO with status, message, and timestamp for all error responses
- Use `UUID` for all entity IDs (`GenerationType.UUID`)
- Passwords hashed with BCrypt via Spring Security's `PasswordEncoder`

### Frontend (TypeScript/React)
- **No external UI component libraries** — all components custom-built (Recharts is the only exception)
- All pages are `'use client'` client components (using `useState`, `useEffect`, `useRouter`)
- Styling: Tailwind CSS utility classes, CSS variables for theme colors
- API calls go through the centralized Axios instance in `lib/api.ts` — never use raw `fetch()`
- Type safety: all API responses typed with interfaces from `types/index.ts`
- Error messages: map backend `ErrorResponse.message` to user-friendly strings via `errorMessages.ts`
- Auth helpers: use `lib/auth.ts` (`setUsername`, `getUsername`, `removeUsername`, `isAuthenticated`) — they handle SSR checks for `localStorage`. JWT is in an HttpOnly cookie, never accessed by frontend JS

### General
- No Lombok — Java classes use explicit getters/setters
- No `@Autowired` — constructor injection only
- Secrets in environment variables, never committed. Local dev secrets go in gitignored files (`application-local.properties`, `.env.local`)

## Key Design Decisions

### Theme System
- Three modes: Light, Dark, System (follows `prefers-color-scheme`)
- Stored in `localStorage` for instant load AND persisted to backend via `PATCH /me` for cross-device sync
- Implemented via CSS variables + Tailwind `dark:` class strategy on `<html>`
- Toggle in both navbar (quick icon) and settings page (radio group)

### Authentication & Session
- Stateless JWT with 24h expiration, delivered via HttpOnly cookie (SameSite=Lax, Secure in production)
- Login supports both email and username via single `identifier` field
- Frontend tracks session via `username` in `localStorage`; JWT cookie is managed by the browser
- On JWT expiry (401 from any API call): response interceptor clears `username`, redirects to `/login?expired=true`, login page shows "Session expired" modal
- Logout calls `POST /auth/logout` to clear the cookie server-side
- No token refresh — re-authenticate on expiry

### Data Patterns
- Applications use soft-delete (`deletedAt` timestamp, filtered by `@SQLRestriction`)
- Server-side pagination: `GET /applications?page=0&size=20&sort=appliedDate,desc&search=...&status=...`
- Stats computed server-side: `GET /applications/stats` returns aggregated status breakdown, monthly counts, response rate
- User profile: `GET /me`, `PATCH /me` (username, email, password, theme), `DELETE /me` (soft-delete with cascading application cleanup)

### UI Patterns
- Toast notifications: bottom-center, fade animation, stacked, auto-dismiss (success: 3s, error: 6s)
- Inline editing: only for status field (click badge → dropdown → save on blur/Enter → spinner while saving → revert on failure)
- Row actions via kebab menu: Edit (opens `EditModal`), Open Website (new tab, http/https only, disabled for other schemes), Delete (opens `ConfirmDialog`)
- Responsive: table on desktop (`md`+), `ApplicationCard` stack on mobile (<768px), sidebar collapses to hamburger drawer
- Edit modal: `ApplicationForm` pre-fills all fields; portal password is **always blank** (write-only) — only included in PATCH payload when user types a new value
- Network failures: offline banner at top, retry button on failed GETs, error toasts on failed mutations

## CI/CD

GitHub Actions runs on pushes/PRs to `main` via a single `ci.yml` workflow with path filtering (`dorny/paths-filter`):
- **Backend Tests** (`backend-test`): runs only when `backend/**` changes (always on push to `main`). Uses PostgreSQL 17 service container, uploads JaCoCo HTML report.
- **Frontend Tests** (`frontend-test`): runs only when `frontend/**` changes (always on push to `main`). Runs lint → test → build.
- **CI Gate** (`ci-gate`): aggregates results — passes when jobs succeed or skip, fails only on actual failure.

**Branch Protection:** `main` requires `CI Gate` and `Claude Code Review` to pass before merging.

## Architectural Decisions

Non-obvious design choices are documented in `.claude/decisions.md`. **Read it before making changes to auth, credential handling, responsive layout, or the edit form.** It exists to prevent future sessions from accidentally reversing intentional decisions.

## Backend API Reference

*(For full API reference, see `.claude/api-reference.md`)*
