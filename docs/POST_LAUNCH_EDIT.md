## Post Launch Edit

This doc is a lightweight "post-launch edit" playbook: what to change, how to validate, and what to monitor—without introducing regressions.

### Completed fixes
- [x] **Fix #1** – Refresh-token flow: `createSession()` now uses `createRefreshToken(userId)` (JWT stateless approach)

### Edit principles
- **Small batches**: ship 1–3 related changes at a time.
- **Measure everything**: add/confirm metrics before refactors.
- **Security-first**: anything auth/session/CSP/CSRF gets priority and extra review.
- **Kill switches**: feature flags for risky changes (auth, sanitizer, caching).

### Implementation checklist

**Security**
- [ ] Gate `'unsafe-eval'` to development only (CSP in `api/server.js`)
- [ ] Verify cookie flags (`httpOnly`, `secure`, `sameSite`) for `accessToken`, `refreshToken`
- [ ] Unify CSRF token strategy and cookie flags; confirm all mutating endpoints covered
- [ ] Confirm admin endpoints are protected and rate limited; audit logs for secret leakage

**Performance**
- [x] Move heavy deps (`puppeteer`, `sharp`) out of runtime if only used by scripts/admin
- [ ] Consolidate DB round trips in perfume detail, vault, trader pages
- [ ] Replace `alert()` with toast/notification system in `ReviewSection`, perfume delete flow

**Code quality**
- [ ] Add types for auth/session, API responses, core models (reduce `any`)
- [ ] Create single canonical "get session from request" utility
- [ ] Remove `cookies.token` fallback after migration window

**Functionality**
- [ ] Implement review edit UX (edit modal + update action)
- [ ] Preserve navigation context via URL/query params where `location.state` is used
- [ ] Replace blocking dialogs with toasts + inline messaging

**Testing**
- [ ] Auth regression: login, refresh, logout, roles, token expiry
- [ ] CSRF: all POST/PUT/DELETE routes (valid/invalid token)
- [ ] XSS: submit `<script>` and handlers into review/message fields; verify sanitization
- [ ] Perf: measure TTFB and DB query counts before/after changes

**Monitoring**
- [ ] Set up alerts for 401/403 and 429 rates
- [ ] Confirm correlation IDs (`X-Correlation-ID`) in logs
- [ ] Monitor slow queries and connection pool usage
- [ ] Track client-side render and API fetch errors

---

### Post-launch edits checklist

### A) Security hardening edits
- **CSP**: ensure production CSP does NOT include `'unsafe-eval'` (dev-only).
  - Touchpoints: `api/server.js`, `app/utils/security/helmet-config.server.js`
- **Cookies**: confirm `httpOnly`, `secure`, `sameSite` are correct for `accessToken`, `refreshToken`.
  - Touchpoint: `app/models/session.server.ts`
- **CSRF**: unify token strategy and cookie flags, and confirm all mutating endpoints are covered.
  - Touchpoints: `app/utils/server/csrf-middleware.server.js`, `app/utils/server/csrf.server.ts`, `useCSRF` client hook, `/api/*` actions
- **Audit + monitoring**: ensure admin endpoints are protected and rate limited; confirm logs don't leak secrets.
  - Touchpoints: `api/server.js` admin endpoints, audit/security monitors

### B) Performance edits
- **Dependency slimming**: move heavy tooling deps out of runtime deployment where possible.
  - Touchpoint: `package.json`
- **Loader query consolidation**: reduce DB round trips in hot routes (perfume detail, vault listing, trader pages).
  - Touchpoints: `app/routes/perfume.tsx` and related model calls
- **Replace `alert()`**: switch to non-blocking UI errors.
  - Touchpoints: `ReviewSection`, `perfume` delete flow, etc.

### C) Code quality edits
- **Remove `any`**: prioritize auth/session types, API response envelopes, and core models.
- **Deduplicate auth parsing**: single canonical "get session from request".
- **Kill legacy cookie paths**: remove `cookies.token` fallback after migration window.

### D) Functionality edits (customer-facing)
- **Review editing**: implement edit UX (core community feature).
- **Preserve navigation context via URL**: replace `location.state` reliance with query params where needed (shareable links).
- **Better error UX**: replace blocking dialogs with toasts + inline messaging.

### Test plan for post-launch edits
- **Auth regression**
  - Login, refresh session, logout, role checks (admin/editor), token expiry behavior
- **CSRF**
  - All POST/PUT/DELETE routes: valid token passes, missing/invalid token blocks
- **XSS**
  - Attempt to submit `<script>` and event handlers into review/message fields; ensure sanitizer strips/escapes
- **Perf sanity**
  - Measure TTFB and DB query counts on perfume detail and vault pages before/after

### Monitoring to watch after edits
- **401/403 rates** (auth/CSRF)
- **429 rates** (rate limiting)
- **Server error rate** + correlation IDs (`X-Correlation-ID`)
- **Slow queries / connection pool saturation** (Prisma/Postgres)
- **Client errors** (render errors and API fetch failures)

### Notes
- Rich text reviews are rendered with `dangerouslySetInnerHTML`. This is acceptable only if sanitize-on-write is enforced everywhere.
  - Render touchpoint: `app/components/Molecules/ReviewCard/ReviewCard.tsx`
  - Write touchpoint: `app/models/perfumeReview.server.ts` (DOMPurify allowlist)
