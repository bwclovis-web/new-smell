# Phase 7: Fonts — Completed

**Date:** 2026-02-18

---

## Summary

Phase 7 font optimizations were verified and documented. All checklist items are already implemented. Font families (Limelight, Inter with system fallbacks) are unchanged.

---

## Checklist Status

| Item | Status | Implementation |
|------|--------|----------------|
| Use `font-display: swap` for web fonts | ✅ | Limelight @font-face rules use `font-display: swap` |
| Preload only critical font files | ✅ | limelight-latin.woff2 preloaded in root.tsx links |
| Subset fonts if possible | ✅ | Limelight split into latin + latin-ext via unicode-range |
| Prefer system fonts where acceptable | ✅ | --font-sans: Inter, ui-sans-serif, system-ui; --font-headline: Limelight, ui-serif, Georgia |

---

## Font Families (Unchanged)

### Headlines — Limelight

- **Stack:** `"Limelight", ui-serif, Georgia, "Times New Roman", Times, serif`
- **Loading:** Self-hosted, no Google Fonts
- **Subsets:** latin (above-the-fold), latin-ext (extended Latin)
- **font-display:** swap
- **Preload:** limelight-latin.woff2 only (critical path)

### Body — Inter + System

- **Stack:** `"Inter", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", ...`
- **Loading:** Inter used when available as system font; otherwise ui-sans-serif, system-ui
- **No @font-face for Inter:** avoids extra network requests; uses system fonts where acceptable

---

## Technical Details

### 1. font-display: swap

Both Limelight @font-face rules in `app/fonts.css` use `font-display: swap`:

```css
@font-face {
  font-family: 'Limelight';
  font-display: swap;
  /* ... */
}
```

### 2. Critical font preload

`app/root.tsx` preloads only the critical font (latin, used above the fold):

```tsx
{
  rel: "preload",
  href: "/fonts/limelight-latin.woff2",
  as: "font",
  type: "font/woff2",
  crossOrigin: "anonymous",
}
```

latin-ext is not preloaded to keep the critical path small.

### 3. Subsets (unicode-range)

- **latin:** U+0000-00FF, U+0131, U+0152-0153, ...
- **latin-ext:** U+0100-02BA, U+02BD-02C5, U+02C7-02CC, ...

### 4. System font fallbacks

`app/app.css` @theme:

```css
--font-headline: "Limelight", ui-serif, Georgia, "Times New Roman", Times, serif;
--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif, ...;
```

---

## Files Referenced

- `app/fonts.css` — Limelight @font-face
- `app/app.css` — font theme variables
- `app/root.tsx` — font preload in links

---

## Optional Follow-ups

- Add `size-adjust` / `ascent-override` / `descent-override` to Limelight @font-face to reduce CLS during font swap (advanced, requires font metrics)
- Consider `font-display: optional` for latin-ext if extended Latin is rarely used above the fold (trade-off: possible invisible text until font loads)
