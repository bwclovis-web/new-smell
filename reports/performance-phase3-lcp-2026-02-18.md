# Phase 3: LCP (Largest Contentful Paint) — Completed

**Date:** 2026-02-18

---

## Summary

LCP optimizations targeting < 2.5 seconds have been implemented for the home page. The hero / main LCP image is now preloaded in the document head, and the above-the-fold image uses `fetchpriority="high"`.

---

## Changes Implemented

| Item | Status |
|------|--------|
| Preload hero / main LCP image in document head | ✅ Done via `links` export in home route |
| Add `fetchpriority="high"` to main above-the-fold image | ✅ Already on hero `<img>` (line 113) |
| Hero image preload with `fetchPriority: "high"` | ✅ Added in route `links` |
| Minimize render-blocking resources | ✅ Root uses self-hosted font + preload; no Google Fonts |
| Inline or preload critical CSS | N/A — app.css loaded via standard link |

---

## Technical Details

### Preload Link (Document Head)

The home route now exports a `links` function that adds a preload link for the hero image:

```ts
export const links: LinksFunction = () => [
  {
    rel: "preload",
    href: banner,  // landing.webp — Vite-processed URL
    as: "image",
    type: "image/webp",
    fetchPriority: "high",
  },
]
```

This causes the browser to discover and fetch the LCP image as early as possible during document parsing, before the hero `<img>` is rendered.

### Hero Image Attributes

The hero image in `home.tsx` already has:

- `fetchPriority="high"`
- `loading="eager"`
- `width` and `height` for CLS
- WebP format (landing.webp)

---

## Optional Follow-ups

- **Hero size:** Verify `landing.webp` is compressed and under ~200KB. Run `npm run optimize:images` if needed.
- **CDN:** Consider `IMAGE_CDN_URL` (Cloudinary, ImageKit, etc.) for large external images (see `imageOptimization.ts`).

---

## Files Modified

- `app/routes/home.tsx` — Added `links` export with hero image preload
