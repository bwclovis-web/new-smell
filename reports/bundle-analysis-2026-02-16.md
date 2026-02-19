# Bundle Analysis Report

**Generated:** 2026-02-16  
**Source:** `npm run analyze:bundle`  
**Build directory:** `build/`

---

## Summary

| Category | Files | Size |
|----------|-------|------|
| **Total Assets** | 231 | 38,265.67 KB (~37 MB) |
| JavaScript | 144 | 2,236.03 KB |
| CSS | 1 | 109.96 KB |
| Images | 78 | 35,714.69 KB |

---

## JavaScript Bundles

| Type | Files | Size |
|------|-------|------|
| OTHER | 119 | 653.86 KB |
| ADMIN | 7 | 607.86 KB |
| VENDOR | 9 | 777.37 KB |
| MAIN | 9 | 196.94 KB |

---

## Images

| Format | Files | Size |
|--------|-------|------|
| .webp | 68 | 12,854.23 KB |
| .png | 10 | 22,860.46 KB |

**Large images (>100KB):** 57

---

## Recommendations

1. ⚠️ **Vendor bundle (777.37KB)** exceeds recommended size (200KB). Consider splitting vendor libraries.
2. ℹ️ **11 JavaScript files** exceed 50KB. Consider lazy loading.

---

## Bundle Splitting Suggestions

1. Use React.lazy() for route-based code splitting
2. Split vendor libraries into separate chunks
3. Implement dynamic imports for heavy components
4. Use webpack-bundle-analyzer for detailed analysis
