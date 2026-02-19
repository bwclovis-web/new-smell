# Phase 2: Image Optimization — Completed

**Date:** 2026-02-16

---

## Summary

All consumer-facing raw `<img>` tags have been replaced with `OptimizedImage` across the application. Above-the-fold images use `priority={true}`; below-the-fold use `priority={false}`. Width, height, `sizes`, and quality are set consistently.

---

## Components Updated

| Component | Change |
|-----------|--------|
| **WishlistItemCard** | Replaced raw `<img>` with `OptimizedImage` (400×192, priority=false) |
| **TitleBanner** | Replaced raw `<img>` with `OptimizedImage` (1200×600, priority=true) |
| **404Page** | Replaced raw `<img>` with `OptimizedImage` (1200×800, priority=true) |
| **LoginLayout** | Replaced raw `<img>` with `OptimizedImage` (1200×800, priority=true) |
| **home.tsx** | Replaced raw `<img>` with `OptimizedImage` (1200×800, priority=true) |
| **GlobalNavigation** | Replaced logo `<img>` with `OptimizedImage` (160×25, priority=true) |
| **ItemsSearchingFor** | Replaced raw `<img>` with `OptimizedImage` (48×48, priority=false) |
| **PerfumeHousePerfumeList** | Added `priority={index < 6}` for first 6 perfume thumbnails |
| **RecommendedForYou** | Added `priority={index < 3}` for first 3 perfume cards |

---

## Already Using OptimizedImage

- HeroHeader
- LinkCard

---

## Image Best Practices Applied

- **Width/height** — Set on all `OptimizedImage` instances to reduce CLS
- **Priority** — Above-the-fold (hero, home, login, 404, logo, first few perfume cards) use `priority={true}`
- **Sizes** — Responsive `sizes` used where applicable (e.g. `(max-width: 640px) 100vw, 50vw`)
- **Placeholder** — `placeholder="blur"` used for hero and banner images

---

## Optional Next Step

Enable WebP build if not already:

```bash
npm run build:webp
```

---

## Files Modified

- `app/components/Organisms/WishlistItemCard/WishlistItemCard.tsx`
- `app/components/Organisms/TitleBanner/TitleBanner.tsx`
- `app/components/Containers/404Page/404Page.tsx`
- `app/components/Containers/PerfumeHouse/PerfumeHousePerfumeList.tsx`
- `app/components/Containers/Recommendations/RecommendedForYou.tsx`
- `app/components/Containers/TraderProfile/ItemsSearchingFor/ItemsSearchingFor.tsx`
- `app/components/Molecules/GlobalNavigation/GlobalNavigation.tsx`
- `app/routes/login/LoginLayout.tsx`
- `app/routes/home.tsx`
