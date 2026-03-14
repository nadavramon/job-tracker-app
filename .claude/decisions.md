# Architectural Decisions

This file records non-obvious design choices made during implementation.
Its purpose is to prevent future sessions from accidentally reversing intentional decisions.

---

## Frontend

### Password field is write-only in `EditModal` / `ApplicationForm`
**Decision:** The portal password field always initialises to `''` (empty) when the edit modal opens, even when the application has a stored password. The password is only included in the `PATCH /applications/{id}` payload when the user explicitly types a new value.

**Why:** Pre-filling the password would round-trip the plaintext credential from the server into the DOM, making it visible in browser DevTools. This is a security-in-depth measure: even though the backend encrypts credentials at rest, there is no reason to expose the decrypted value in the UI unless the user is actively changing it.

**Effect on UX:** The password input shows placeholder text "Leave blank to keep existing" to communicate intent.

---

### Mobile cards show static `StatusBadge`; desktop table shows interactive `StatusSelect`
**Decision:** `ApplicationCard` (mobile, < 768px) displays a read-only `StatusBadge`. `ApplicationsTable` (desktop, ≥ 768px) uses `StatusSelect` for inline status editing.

**Why:** Inline dropdowns are difficult to use on touch devices. On mobile, status changes are expected to go through the full Edit modal (accessible via the kebab menu), which gives the user a larger touch target and a clear save action.

---

### `JOB_TYPE_LABELS` lives in `lib/constants.ts`
**Decision:** The human-readable label map for `JobType` enum values is in `frontend/lib/constants.ts`, not in `types/index.ts`.

**Why:** `types/index.ts` contains pure TypeScript type definitions that mirror backend DTOs. Display labels are a UI concern, not a type concern. `constants.ts` is the correct home for shared UI constants. This keeps `types/` free of display logic and makes it easier to translate or change labels independently.

---

### `isSafeUrl` check in `RowActionMenu` — both `disabled` and `handleOpenWebsite`
**Decision:** The URL scheme guard (`http://` or `https://` prefix) is extracted into a derived boolean `isSafeUrl` that is used in both the button's `disabled` attribute and the `handleOpenWebsite` callback.

**Why:** Previously only the click handler validated the URL, so a `javascript:` link would render the "Open Website" button as enabled, misleading the user. Disabling the button for non-HTTP URLs communicates safety to the user and aligns intent with behaviour.

---

### `ApplicationForm` uses `key={application.id}` in `EditModal`
**Decision:** `EditModal` passes `key={application.id}` to `ApplicationForm`, forcing a full remount whenever a different application is selected for editing.

**Why:** `ApplicationForm` initialises its field state via `useState` lazy initialiser, which only runs on mount. Without the `key` prop, switching from app A to app B while the modal is open would leave app A's data in the form. The `key` makes the remount contract explicit and resilient to future changes in `Modal`'s render behaviour.

---

### `websiteLink` URL validation in `ApplicationForm`
**Decision:** `ApplicationForm`'s `validate()` function rejects `websiteLink` values that do not start with `http://` or `https://`. The `noValidate` attribute is used on the form to suppress browser-native validation (which is inconsistent across browsers).

**Why:** The backend validates `websiteLink` via `@Pattern` (max length, allowed schemes). The frontend mirrors this at the form layer to give immediate feedback before the API call. The `RowActionMenu` also validates before calling `window.open`, so there are two independent guards.

---

## Backend

### Soft delete only — never `repository.delete()`
**Decision:** Deleting an application sets `deletedAt = now()` on the entity and saves it. Hard deletion is never used. The `@SQLRestriction("deleted_at IS NULL")` on the `Application` entity automatically filters deleted records from all queries.

**Why:** Soft delete preserves data for audit purposes and makes accidental deletion recoverable. It also simplifies cascading: deleting a user soft-deletes their applications in the same transaction.

---

### Portal credentials encrypted at rest via `EncryptionService`
**Decision:** `portalUsername` and `portalPassword` fields on `Application` are encrypted before storage and decrypted on read using a symmetric `EncryptionService`. They are never stored or returned as plaintext.

**Why:** Portal credentials are secrets. Even if the database is compromised, credentials are not directly exposed.

---

### JWT delivered via HttpOnly cookie
**Decision:** The JWT is set as an HttpOnly, SameSite=Lax cookie by the backend on login/register. The frontend never sees or stores the token — it relies on `withCredentials: true` for automatic cookie sending. Session presence is tracked via `username` in `localStorage`.

**Why:** HttpOnly cookies are inaccessible to JavaScript, eliminating XSS-based token theft. SameSite=Lax mitigates CSRF for state-changing requests. This replaced the previous `localStorage` token approach (Phase 6, PRs #95–#98).

---

### Login accepts `identifier` (email or username)
**Decision:** The login endpoint accepts a single `identifier` field that is matched against both `email` and `username` columns, rather than separate fields.

**Why:** Better UX — users don't need to remember whether they registered with an email or username. The backend resolves which field matched.
