## Top 10 Post Launch Fixes

This is a prioritized post-launch list focused on production risk reduction (security + reliability) and measurable UX/perf wins.

### 1) Fix refresh-token flow (currently inconsistent / likely broken)
- **Why**: `createSession()` issues a random refresh token, but `refreshAccessToken()` expects a JWT refresh token. This breaks refresh and undermines session design.
- **Evidence**
  - `app/utils/security/session-manager.server.ts`: `createSession()` uses `generateRefreshToken()` (random hex), `refreshAccessToken()` uses `verifyRefreshToken()` (JWT)
  - `app/models/session.server.ts`: sets `refreshToken` cookie from `createSession()`
  - `app/utils/sharedLoader.ts`: calls `refreshAccessToken(refreshToken)`
- **Fix**
  - Choose one approach:
    - **JWT refresh token** (stateless): `createSession()` should call `createRefreshToken(userId)` not `generateRefreshToken()`
    - **Opaque refresh token** (stateful): keep random token but store + rotate it server-side (DB/Redis), and validate on refresh
- **Impact**: High (auth reliability + security)
- **Effort**: Medium

### 2) Standardize cookie/token names across app + Express load context
- **Why**: Different code reads `accessToken` vs legacy `token`. Express `getLoadContext` checks `cookies.token` only.
- **Evidence**
  - `app/routes/RootLayout.tsx`, `app/routes/perfume.tsx`: prefer `accessToken`, fallback `token`
  - `api/server.js`: `getLoadContext` reads `cookies.token` only
- **Fix**
  - Make one canonical cookie name (recommend `accessToken` + `refreshToken`)
  - Keep legacy fallback temporarily, then remove after migration window
- **Impact**: High (fewer auth edge cases)
- **Effort**: Low–Medium

### 3) Tighten CSP in production (remove unsafe-eval)
- **Why**: Current Helmet CSP in `api/server.js` includes `'unsafe-eval'` (should be dev-only). This materially weakens XSS defenses.
- **Evidence**
  - `api/server.js`: `scriptSrc` includes `'unsafe-eval'`
  - `app/utils/security/helmet-config.server.js`: production config already avoids `'unsafe-eval'`
- **Fix**
  - Gate `'unsafe-eval'` to development only or reuse the shared helmet config
- **Impact**: High (security hardening)
- **Effort**: Low

### 4) Normalize CSRF approach (cookie flags + single validator path) ✅
- **Why**: Express CSRF cookie is `httpOnly: false`, but TS helper suggests `httpOnly: true`. Mixed patterns increase bypass/regression risk.
- **Evidence**
  - `app/utils/server/csrf-middleware.server.js`: `setCSRFCookie(... httpOnly: false)`
  - `app/utils/server/csrf.server.ts`: `createCSRFCookie(... httpOnly: true)`
- **Fix** (done)
  - Unified on double-submit cookie pattern: `httpOnly: false` in both `setCSRFCookie` and `createCSRFCookie`
  - All mutating routes use the same mechanism:
    - `/api/*`: Express `csrfMiddleware` validates `x-csrf-token` header (exclusions: log-out, wishlist, admin stats)
    - Non-API (sign-in, sign-up, admin/*): actions call `requireCSRF(request, formData)` with timing-safe validation
  - Added `requireCSRF()` helper; ensured all forms include `<CSRFToken />`
- **Impact**: High (security + maintainability)
- **Effort**: Medium

### 5) Replace `alert()` error UX in core flows
- **Why**: `alert()` blocks the main thread and feels broken on mobile; also makes error handling inconsistent.
- **Evidence**
  - `app/components/Organisms/ReviewSection/ReviewSection.tsx`: multiple `alert(...)`
  - `app/routes/perfume.tsx`: delete error path uses `alert(...)`
- **Fix**
  - Central toast/notification system + inline error messages
- **Impact**: Medium (UX polish, perf)
- **Effort**: Low

### 6) Review HTML rendering: keep sanitize-on-write + add defense-in-depth
- **Why**: `ReviewCard` uses `dangerouslySetInnerHTML`; safe only if every write path sanitizes.
- **Evidence**
  - `app/components/Molecules/ReviewCard/ReviewCard.tsx`: `dangerouslySetInnerHTML`
  - `app/models/perfumeReview.server.ts`: sanitizes via DOMPurify allowlist
- **Fix**
  - Ensure *all* review updates/imports/admin tools pass through the same sanitizer
  - Optional defense: re-sanitize at render-time for untrusted legacy records (feature-flagged)
- **Impact**: Medium–High (security)
- **Effort**: Low–Medium

### 7) Reduce cold-start / deploy size risk from heavy runtime deps
- **Why**: `puppeteer` and `sharp` can bloat installs and slow serverless cold starts.
- **Evidence**
  - `package.json` includes `puppeteer`, `sharp` in `dependencies`
- **Fix**
  - If used only for scripts/admin: move to separate package or optional path; avoid bundling in runtime deployment
- **Impact**: Medium (perf + deploy reliability)
- **Effort**: Medium

### 8) Consolidate auth helpers (avoid drift) ✅
- **Why**: Multiple helpers parse cookies + verify token with slight differences.
- **Evidence**
  - `app/utils/server/auth.server.ts`, `app/utils/sharedLoader.ts`, route-local helpers like in `app/routes/perfume.tsx`
- **Fix** (done)
  - One "session-from-request" utility in `app/utils/session-from-request.server.ts` returning `{ userId, user?, tokens?, newAccessToken? }`
  - Refactored: `server/auth.server.ts`, `sharedLoader.ts`, `perfume.tsx`, `RootLayout.tsx`, `user-perfumes.tsx`, `api/server.js` (getLoadContext, requireAdminAuth)
  - API server uses `getSessionFromExpressRequest` in `api/utils.js` for Express req
- **How to test**: Run `npm run test:unit -- session-from-request` and `npm run test:integration -- --grep auth` (see Testing section below)
- **Impact**: Medium (reliability)
- **Effort**: Medium

### 9) Improve data loading efficiency on perfume detail
- **Why**: Perfume detail does multiple DB calls and repeated cookie parsing; likely reducible.
- **Evidence**
  - `app/routes/perfume.tsx`: loader does user lookup + wishlist + ratings + reviews
- **Fix**
  - Combine into fewer Prisma queries, cache repeated parsing, avoid redundant lookups
- **Impact**: Medium (TTFB/DB load)
- **Effort**: Medium

### 10) Finish "Edit review" functionality (currently stubbed) ✅
- **Why**: Core community feature is half-complete; impacts satisfaction + retention.
- **Evidence**
  - `app/components/Organisms/ReviewSection/ReviewSection.tsx`: `handleEditReview` is an alert stub
- **Fix** (done)
  - Implemented edit UI with form that supports both create and edit modes
  - Added `handleUpdateReview` function that calls the existing `update` action in `/api/reviews`
  - Implemented optimistic updates: UI updates immediately, then syncs with server response
  - Added error handling with rollback on failure
  - Added translation keys for edit functionality (`editYourReview`, `updateReview`, `failedToUpdateReview`)
  - Form dynamically shows "Edit Your Review" vs "Write Your Review" based on mode
- **Impact**: Medium (functionality)
- **Effort**: Medium

### Suggested rollout order (safe)
- Week 1: #1, #2, #3, #4
- Week 2: #5, #10
- Week 3: #7, #9, #8, #6 (hardening/cleanup)

### Implementation checklist

- [x] **Fix #1** – Refresh-token flow: Update `createSession()` to use `createRefreshToken(userId)` (or implement opaque token storage)
- [x] **Fix #2** – Cookie/token names: Standardize on `accessToken`/`refreshToken`; update Express `getLoadContext`; add temporary legacy fallback
- [x] **Fix #3** – CSP: Gate `'unsafe-eval'` to development only in `api/server.js` (or use shared helmet config)
- [x] **Fix #4** – CSRF: Unify cookie flags and validation; ensure all mutating routes use same mechanism
- [ ] **Fix #5** – Replace `alert()`: Add toast/notification system; update `ReviewSection` and perfume delete flow
- [x] **Fix #6** – HTML sanitization: Audit all review write paths; add optional render-time sanitization for legacy data
- [x] **Fix #7** – Deps: Move `puppeteer`/`sharp` to optional path or separate package if not needed at runtime
- [x] **Fix #8** – Auth helpers: Create single "session-from-request" utility; refactor routes to use it
- [x] **Fix #9** – Perfume loader: Consolidate DB queries; reduce redundant parsing in `perfume.tsx`
- [x] **Fix #10** – Edit review: Implement edit UI + `update` action; add optimistic updates
- [ ] **Verify**: Auth regression tests (login, refresh, logout, roles)

### Testing Fix #8 (session-from-request)
- **Unit test**: `npm run test:unit -- session-from-request` (tests `getTokensFromCookieHeader`, `getSessionFromCookieHeader`, `getSessionFromRequest`)
- **Integration (auth)**: `npm run test:integration -- --grep auth`
- **Manual**: Sign in → visit perfume page → verify wishlist/icons show when logged in; visit /my-reviews → should require auth
- [ ] **Verify**: CSRF tests on all mutating endpoints
- [ ] **Verify**: XSS tests on review/message fields
- [ ] **Verify**: TTFB and DB query counts before/after

### Testing Fix #9 (perfume loader)
- **What changed**: Loader now fetches session and perfume in parallel, then a single batched `getPerfumeDetailPayload()` (ratings, reviews, wishlist, user rating, user review) from `app/models/perfumeDetail.server.ts`. No DB schema or migrations required.
- **Unit/Integration**: `npm run test:integration -- --grep perfume` (route tests still use mocked rating/review/wishlist; no new mocks needed).
- **Manual testing**:
  1. **Unauthenticated**: Open any perfume URL (e.g. `/perfume/<slug>`). Page should show perfume, house link, notes, description, rating summary, and reviews. No wishlist/heart or “your review” (or rate) controls.
  2. **Authenticated**: Sign in, then open the same perfume URL. Verify: wishlist heart reflects in/out of wishlist; your rating (if any) appears in the rating section; your review (if any) appears in the review section; add/remove wishlist and submit rating/review still work.
  3. **404**: Visit `/perfume/non-existent-slug` and confirm appropriate error (not a blank page).
- **DB**: No migration or schema update needed for Fix #9. To refresh or seed data: `npx prisma db push` (or `npx prisma migrate deploy` in production); seed with `npx prisma db seed` if you use a seed script.
