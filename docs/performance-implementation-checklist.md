# Performance Implementation Checklist

Implementation checklist for improving the production score (Lighthouse Performance / Vercel Speed Insights). Use this to track progress toward a target score of 90+.

---

## Context

- **Current score:** ~33 (poor)
- **Target score:** 90+ (good)
- **Key metrics:** LCP (Largest Contentful Paint), INP/FID, CLS (Cumulative Layout Shift)

---

## Phase 1: Diagnostics

- [ ] Run PageSpeed Insights on production URL and capture baseline
  - https://pagespeed.web.dev/
- [ ] Run local performance analyzer (requires Chrome: `npx puppeteer browsers install chrome`):
  ```bash
  npx tsx scripts/analyze-performance.ts https://your-production-url.vercel.app --output=reports/performance-analysis-TIMESTAMP.json
  ```
- [x] Run bundle analyzer and note largest chunks: ✅ **Done 2026-02-16**
  ```bash
  npm run analyze:bundle
  ```
  - **Report:** [reports/bundle-analysis-2026-02-16.md](../reports/bundle-analysis-2026-02-16.md)
  - Summary: 231 assets (~37 MB), vendor 777 KB (>200 KB target), 57 images >100 KB
- [ ] Document current LCP, CLS, and INP from Lighthouse report

**Phase 1 reports:** [reports/performance-phase1-diagnostics-2026-02-16.md](../reports/performance-phase1-diagnostics-2026-02-16.md)

---

## Phase 2: Image Optimization (Highest impact) ✅ **Done 2026-02-16**

### Use OptimizedImage everywhere

- [x] **HeroHeader** — Already used `OptimizedImage` (priority, width, height)
- [x] **LinkCard** — Already used `OptimizedImage` with width/height
- [x] **WishlistItemCard** — Replaced raw `<img>` with `OptimizedImage`
- [x] **TitleBanner** — Replaced raw `<img>` with `OptimizedImage`
- [x] **PerfumeHousePerfumeList** — Already used `OptimizedImage`; added `priority={index < 6}` for first 6
- [x] **RecommendedForYou** — Already used `OptimizedImage`; added `priority={index < 3}` for first 3
- [x] **404Page** — Replaced raw `<img>` with `OptimizedImage`
- [x] **ErrorDisplay** — No images (emoji icons only); N/A
- [x] Audit all `<img>` usage — Replaced remaining: LoginLayout, home, GlobalNavigation, ItemsSearchingFor

### Image best practices

- [x] Add `width` and `height` to all `OptimizedImage` instances to prevent CLS
- [x] Set `priority={true}` for above-the-fold images (hero, home, login, 404, logo, first 3–6 perfume cards)
- [x] Set `priority={false}` (or omit) for below-the-fold images
- [ ] Enable WebP build if not already: `npm run build:webp`
- [x] Ensure `sizes` prop is set for responsive images where applicable

**Phase 2 report:** [reports/performance-phase2-image-optimization-2026-02-16.md](../reports/performance-phase2-image-optimization-2026-02-16.md)

---

## Phase 3: LCP (Largest Contentful Paint) ✅ **Done 2026-02-18**

Target: LCP < 2.5 seconds.

- [x] Preload hero / main LCP image in the document head
- [x] Add `fetchpriority="high"` to the main above-the-fold image
- [ ] Ensure hero image is compressed and under ~200KB
- [ ] Consider CDN or Vercel Image Optimization for large external image URLs
- [x] Minimize render-blocking resources above the fold
- [x] Inline or preload critical CSS if applicable

**Phase 3 report:** [reports/performance-phase3-lcp-2026-02-18.md](../reports/performance-phase3-lcp-2026-02-18.md)

---

## Phase 4: JavaScript / Bundle ✅ **Done 2026-02-18**

- [x] Review bundle analyzer output; identify chunks > 100KB
- [x] Add route-level code splitting for heavy routes (`React.lazy` + `Suspense`)
- [x] Lazy-load non-critical components (modals, admin panels, charts)
- [x] Defer third-party scripts (analytics, Stripe) until after LCP
- [x] Ensure Tree Shaking is effective for large libraries
- [x] Consider dynamic imports for i18n bundles if large

**Phase 4 report:** [reports/performance-phase4-js-bundle-2026-02-18.md](../reports/performance-phase4-js-bundle-2026-02-18.md)

---

## Phase 5: CLS (Cumulative Layout Shift)

Target: CLS < 0.1.

- [ ] Add explicit `width` and `height` (or aspect-ratio) to all images
- [ ] Reserve space for dynamic content (ads, user-generated content)
- [ ] Avoid inserting content above existing content without reserving height
- [ ] Use skeleton loaders or min-height for async content
- [ ] Check navigation and modals for layout shifts
- [ ] Verify font loading doesn’t cause FOIT/FOUT shifts

---

## Phase 6: Caching & Delivery

- [ ] Confirm `vercel.json` cache headers apply to all static assets
- [ ] Ensure `/build`, `/assets`, `/images` paths are correct for your deployment
- [ ] Verify long cache headers (e.g. `max-age=31536000`) for hashed assets
- [ ] Consider service worker / PWA caching if applicable

---

## Phase 7: Fonts

- [ ] Use `font-display: swap` for web fonts
- [ ] Preload only critical font files
- [ ] Subset fonts if possible
- [ ] Prefer system fonts where acceptable

---

## Phase 8: Re-measure & Iterate

- [ ] Re-run PageSpeed Insights after each phase
- [ ] Document score improvements per phase
- [ ] Address remaining Lighthouse opportunities
- [ ] Re-run `tsx scripts/analyze-performance.ts` and compare to baseline
- [ ] Add performance budget or CI check if desired

---

## Quick Reference

| Metric  | Target | Typical fix                    |
|---------|--------|--------------------------------|
| LCP     | < 2.5s | Optimize hero image, preload   |
| INP/FID | < 200ms| Reduce main-thread work, defer |
| CLS     | < 0.1  | Image dimensions, reserve space|

---

## Related

- [OptimizedImage component](../app/components/Atoms/OptimizedImage/OptimizedImage.tsx)
- [imageOptimization utils](../app/utils/imageOptimization.ts)
- [Performance analyzer script](../scripts/analyze-performance.ts)
- `vercel.json` — cache headers configuration
