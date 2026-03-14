# Frontend Build — Implementation Progress

> **Read `CLAUDE.md` first** for full project architecture, conventions, and API reference.

## Current Session State
<!-- Updated at end of each context window — use /wind-down to auto-update -->
- **Active branch:** `feature/cookie-auth-cleanup`
- **Status:** Task 35 merged (PR #98). Starting Task 36 — Final cleanup (#94).
- **In-progress files:** none
- **Blockers/decisions:** none
- **Next step:** Implement Task 36 — Remove Bearer fallback, fully remove token field, update docs.

## Status Legend
- `[ ]` Not started
- `[/]` In progress
- `[x]` Completed & merged to `main`

## Git Workflow

Every sub-task gets its own branch. **Never commit to `main` directly.**

1. `git checkout main && git pull`
2. Create branch: `feature/<name>`, `bugfix/<name>`, or `refactor/<name>`
3. Implement, commit with clear messages (e.g., `feat: add server-side pagination`)
4. Run relevant tests
5. `git push -u origin <branch-name>`
6. **Stop and tell the user** — wait for merge confirmation before starting next sub-task

---

## Completed Phases (See `.claude/archive.md` for details)
- **Phase 1 & 1.5:** Backend Pagination, User Preferences, full Test Coverage, and Security Hardening (JWT, Rate Limiting, XSS).
- **Phase 2:** Theme System, Toast System, Base UI Primitives, Overlays, Data Components, Sidebar (desktop + mobile), Route Groups (Tasks 9a–11).
- **Phase 3:** Auth pages, session expiry handling, offline detection, error message mapping (Tasks 12–15).
- **Phase 4:** Dashboard stats/charts, Applications table (paginated, filtered, sorted), inline status edit, credential visibility, status hints, row actions, delete confirmation, edit modal, mobile card layout (Tasks 16–25).
- **Phase 5:** Create application page, Settings (appearance, profile, account), bugfixes (token expiry, registration errors, hydration), smoke test (Tasks 26–31).

---

## Phase 6 — HttpOnly Cookie Auth Migration

- [x] **32. `feature/cookie-auth-backend`** — Backend cookie infrastructure: set HttpOnly cookie on login/register, add logout endpoint, dual-read filter — #90
- [x] **33. `feature/cookie-auth-axios`** — Frontend Axios switch: `withCredentials: true`, remove Bearer interceptor, add `logout()` service — #91, PR #96
- [x] **34. `feature/cookie-auth-frontend-migration`** — Full frontend migration: remove token functions, delete `useTokenExpiry`, update auth pages/logout/theme + all tests — #92, PR #97
- [x] **35. `feature/cookie-auth-remove-token-body`** — Remove token from JSON response via `@JsonIgnore` — #93, PR #98
- [/] **36. `feature/cookie-auth-cleanup`** — Remove Bearer fallback, fully remove token field, update docs — #94
