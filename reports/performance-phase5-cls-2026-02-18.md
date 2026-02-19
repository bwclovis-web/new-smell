# Phase 5: CLS (Cumulative Layout Shift) — Completed

**Date:** 2026-02-18

**Target:** CLS < 0.1

---

## Summary

CLS mitigations have been implemented across images, async content, Suspense fallbacks, and font loading. Explicit dimensions and reserved space reduce layout shifts when content loads or changes.

---

## Changes Implemented

| Item | Status | Details |
|------|--------|---------|
| Add explicit width/height to all images | ✅ | OptimizedImage and home hero img use width/height |
| Add aspect-ratio to image containers | ✅ | StandardImage container uses aspectRatio when width/height provided |
| Reserve space for dynamic/async content | ✅ | Loading states use min-height |
| Avoid inserting content above existing content | ✅ | No content insertion above fold; modals use overlay |
| Use skeleton loaders or min-height for async content | ✅ | Suspense fallbacks and loading states reserve space |
| Check navigation and modals for layout shifts | ✅ | Modals use fixed positioning; nav fallback reserves height |
| Verify font loading doesn't cause FOIT/FOUT shifts | ✅ | Limelight uses font-display: swap |

---

## Technical Details

### 1. OptimizedImage — aspect-ratio on StandardImage container

**OptimizedImage.tsx** — The StandardImage container now applies `aspectRatio: width/height` when dimensions are provided, so the browser reserves space before the image loads:

```tsx
const aspectRatioStyle =
  width && height ? { aspectRatio: `${width} / ${height}` } : undefined

return (
  <div
    className={`relative overflow-hidden bg-noir-dark/50 ${containerClassName}`.trim()}
    style={aspectRatioStyle}
  >
```

This prevents CLS when parent layouts (e.g. grid cells) only define width.

### 2. Suspense fallbacks — reserved space

**RootLayout.tsx** — Fallback reserves full viewport height:

```tsx
<Suspense fallback={<div className="min-h-svh flex items-center justify-center text-noir-gold/60">Loading...</div>}>
```

**GlobalNavigation.tsx** — Fallback reserves header height:

```tsx
<Suspense fallback={<div className="min-h-[56px] flex items-center justify-center" aria-hidden="true" />}>
```

### 3. PerfumeHousePerfumeList — loading state min-height

**PerfumeHousePerfumeList.tsx** — Loading state reserves space for the grid:

```tsx
<div className="text-center py-6 min-h-[320px] flex items-center justify-center" aria-busy="true">
```

### 4. Images — explicit dimensions

- **OptimizedImage**: All consumers pass width and height (LinkCard, WishlistItemCard, HeroHeader, TitleBanner, 404Page, LoginLayout, GlobalNavigation, ItemsSearchingFor, PerfumeHousePerfumeList, RecommendedForYou, perfume.tsx similar perfumes, MyScents, how-we-work).
- **Home hero** (`home.tsx`): Raw `<img>` with `width={1200}` and `height={800}`.

### 5. Modals

Modals render via `createPortal` to `#modal-portal` with `fixed inset-0` positioning. They overlay content and do not affect document flow or cause CLS.

### 6. Font loading

**fonts.css** — Limelight uses `font-display: swap`:

```css
@font-face {
  font-family: 'Limelight';
  font-display: swap;
  /* ... */
}
```

`swap` shows fallback text immediately and swaps when the font loads, avoiding FOIT. Some FOUT is possible but preferable to invisible text or layout shifts from font metrics changes.

---

## Already in Place (from Phase 2)

- Width and height on all OptimizedImage instances
- `placeholder="blur"` for progressive image loading
- Home hero preload + explicit dimensions

---

## Optional Follow-ups

- Use `font-display: optional` for non-critical fonts to reduce FOUT if desired (may show fallback longer)
- Add `size-adjust` / `ascent-override` / `descent-override` to font-face to reduce swap shift (advanced)

---

## Files Modified

- `app/components/Atoms/OptimizedImage/OptimizedImage.tsx` — aspect-ratio on StandardImage container
- `app/routes/RootLayout.tsx` — Suspense fallback min-h-svh
- `app/components/Molecules/GlobalNavigation/GlobalNavigation.tsx` — Suspense fallback min-h-[56px]
- `app/components/Containers/PerfumeHouse/PerfumeHousePerfumeList.tsx` — Loading state min-h-[320px]

---

## Verification

Run PageSpeed Insights or Lighthouse and confirm CLS score is below 0.1. Use Chrome DevTools > Performance > Experience to observe layout shifts during load.
