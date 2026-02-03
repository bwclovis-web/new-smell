# Font Loading Performance Optimization

## Problem
Lighthouse identified render-blocking resources causing an estimated 900ms delay:
- Google Fonts stylesheet (810ms) from `fonts.googleapis.com`
- CSS bundle from Vercel (16.2 KiB)

These blocked the page's initial render and delayed LCP (Largest Contentful Paint).

## Solution Implemented

### 1. Self-Hosted Fonts ✅
**Eliminated 810ms external font request**

- Downloaded Limelight font files (woff2 format)
- Stored in `public/fonts/`:
  - `limelight-latin.woff2` (13 KB)
  - `limelight-latin-ext.woff2` (8 KB)
- Created `app/fonts.css` with @font-face declarations
- Removed Google Fonts external stylesheet

**Benefits:**
- No third-party DNS lookup
- No SSL handshake to fonts.googleapis.com
- Fonts served from same domain (better caching)
- Reduced network latency

### 2. Font Preloading ✅
**Faster font discovery and rendering**

Added preload hint in `app/root.tsx`:
```typescript
{
  rel: "preload",
  href: "/fonts/limelight-latin.woff2",
  as: "font",
  type: "font/woff2",
  crossOrigin: "anonymous",
}
```

**Benefits:**
- Browser discovers and loads fonts immediately
- No FOUT (Flash of Unstyled Text) delay
- Fonts available before CSS parsing completes

### 3. CSS Optimization ✅
**Better CSS handling in production**

Updated `vite.config.ts` with:
- `cssMinify: true` - Smaller CSS bundles
- `cssCodeSplit: true` - Better caching granularity

### 4. Font Display Strategy ✅
**Already using optimal strategy**

Using `font-display: swap` in @font-face:
- Shows fallback font immediately
- Swaps to custom font when loaded
- Prevents invisible text (FOIT)

## Expected Results

### Before
- Google Fonts: 810ms blocking request
- Total estimated delay: 900ms
- External dependencies: 2 (fonts.googleapis.com, fonts.gstatic.com)

### After
- Google Fonts: **0ms** (eliminated)
- Font loading: ~50-100ms (local file, preloaded)
- External dependencies: **0**
- **Estimated improvement: 700-800ms faster LCP**

## Testing

### 1. Visual Test
1. Run `npm run build && npm run start`
2. Open Network tab in DevTools
3. Verify no requests to `googleapis.com` or `gstatic.com`
4. Confirm `/fonts/limelight-latin.woff2` loads quickly

### 2. Lighthouse Audit
Run a new Lighthouse audit:
```bash
npm run build
npm run start
# Run Lighthouse in Chrome DevTools
```

**Expected improvements:**
- ✅ No render-blocking Google Fonts requests
- ✅ Improved LCP score
- ✅ Reduced Total Blocking Time (TBT)
- ✅ Better Performance score

### 3. Font Rendering
Check that headings still render with Limelight font:
- Hero title on homepage
- All h1, h2, h3 elements
- `.hero-title` class elements

## Files Changed

1. **Created:**
   - `public/fonts/limelight-latin.woff2`
   - `public/fonts/limelight-latin-ext.woff2`
   - `app/fonts.css`

2. **Modified:**
   - `app/app.css` - Added @import for fonts.css
   - `app/root.tsx` - Replaced Google Fonts with font preload
   - `vite.config.ts` - Added CSS optimization flags

## If Lighthouse Still Shows Google Fonts

The app uses **only** self-hosted Limelight (no Google Fonts). If Lighthouse still reports a request to `fonts.googleapis.com/css2?family=Limelight`:

1. **Redeploy** – Ensure the latest build (with self-hosted fonts) is deployed.
2. **Hard refresh / clear cache** – Use a clean profile or "Disable cache" in DevTools when running Lighthouse.
3. **CSP** – Google Fonts domains have been removed from CSP (`api/server.js`, `app/utils/security/helmet-config.server.js`); no stylesheet link to Google Fonts should be present in the app.

## Root CSS (render-blocking)

The root stylesheet (`/assets/root-*.css`) is injected by React Router/Vite and is render-blocking. To move it off the critical path in the future:

- **Critical CSS inlining**: Inline above-the-fold CSS in the document and load the full stylesheet asynchronously (e.g. `media="print"` + `onload="this.media='all'"`), which would require framework or build customization.

## Rollback Plan

If issues occur, revert `app/root.tsx` to:
```typescript
export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Limelight&display=swap",
  },
  { rel: "manifest", href: "/manifest.json" },
]
```

And remove the `@import "./fonts.css"` line from `app/app.css`.

## Additional Optimizations (Future)

1. **Subset fonts** - Only include glyphs actually used
2. **Variable fonts** - If multiple weights needed
3. **WOFF2 compression** - Already using optimal format
4. **Font loading strategy** - Consider `font-display: optional` for non-critical text
5. **Critical CSS inlining** - Inline minimal CSS for above-the-fold content

## References

- [Web.dev - Fast Font Loading](https://web.dev/font-best-practices/)
- [MDN - @font-face](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face)
- [font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display)
