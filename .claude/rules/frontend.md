# Frontend Rules

Applies to all files under `frontend/`.

## Patterns
- All API calls must use the Axios instance from `lib/api.ts` — it sends the HttpOnly cookie automatically via `withCredentials: true`
- Service functions belong in `lib/authService.ts` or `lib/applicationService.ts`, not inline in components
- Use types from `types/index.ts`; do not redefine `Status`, `JobType`, or `Application` locally

## Auth
- JWT is delivered via HttpOnly cookie — the frontend never reads or stores the token
- Session presence is tracked via `username` in `localStorage` using helpers from `lib/auth.ts`
- Protected pages must check `isAuthenticated()` and redirect to `/login` if absent
- On login/register success, store the username from `AuthResponse`
- On logout, call `logout()` from `authService.ts` to clear the cookie server-side

## Testing
- Tests live in `frontend/__tests__/`, mirroring the `app/` page structure
- Use Jest + React Testing Library (`@testing-library/react`)
- Run a single test file: `npm test -- dashboard.test.tsx`
