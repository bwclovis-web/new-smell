# Phase 6: Caching & Delivery — Completed

**Date:** 2026-02-18

---

## Summary

Cache headers in `vercel.json` were verified, extended, and documented. All static asset paths use appropriate Cache-Control values. Service worker caching is already implemented. Long cache for hashed assets, short cache for sw.js (for updates), and moderate cache for i18n locales.

---

## Changes Implemented

| Item | Status | Details |
|------|--------|---------|
| Confirm vercel.json cache headers apply to all static assets | ✅ | Headers for /build/, /assets/, /images/, /fonts/, /locales/, /sw.js |
| Ensure /build/, /assets/, /images/ paths are correct | ✅ | Match React Router + Vite build output and public folder |
| Verify long cache headers (max-age=31536000) for hashed assets | ✅ | /build/, /assets/, /images/, /fonts/ use immutable, 1 year |
| Consider service worker / PWA caching | ✅ | sw.js + ServiceWorkerRegistration; sw.js no-cache for updates |

---

## Technical Details

### 1. vercel.json cache headers

| Path | Cache-Control | Rationale |
|------|---------------|-----------|
| `/build/(.*)` | `public, max-age=31536000, immutable` | Build output; hashed assets |
| `/assets/(.*)` | `public, max-age=31536000, immutable` | Vite chunks (`assets/[name]-[hash].js`); hashed |
| `/images/(.*)` | `public, max-age=31536000, immutable` | Static images in public/images |
| `/fonts/(.*)` | `public, max-age=31536000, immutable` | Font files; versioned |
| `/locales/(.*)` | `public, max-age=86400, stale-while-revalidate=86400` | i18n JSON; moderate cache |
| `/sw.js` | `max-age=0, must-revalidate` | Service worker; always revalidate so updates propagate |

### 2. Path verification

- **React Router + Vite** outputs client chunks to `build/client/assets/[name]-[hash].js` → served at `/assets/`
- **publicPath** in react-router.config is `/`; public files are at root
- **public/images/** → `/images/`
- **public/fonts/** (if any) → `/fonts/` (limelight.woff2 from app/fonts)
- **public/locales/** → `/locales/`
- **public/sw.js** → `/sw.js`

### 3. Service worker / PWA

- **sw.js** — Custom service worker in `public/sw.js`
- **ServiceWorkerRegistration** — Registers sw in production
- **sw.js Cache-Control** — `max-age=0, must-revalidate` so the browser checks for updates on each load
- **vite-plugin-pwa** — Present in devDependencies; custom sw.js used instead

---

## Files Modified

- `vercel.json` — Added /fonts/, /locales/, /sw.js cache headers; formatted for readability

---

## Verification

1. Deploy to Vercel and inspect response headers for `/assets/*`, `/images/*`, `/fonts/*`, `/sw.js`, `/locales/*`
2. Confirm sw.js has `Cache-Control: max-age=0, must-revalidate`
3. Confirm static assets have `Cache-Control: public, max-age=31536000, immutable`
