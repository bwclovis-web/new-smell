# Frontend Performance Optimization Guide

**Date:** January 2025  
**Focus:** Bundle size, React performance, and client-side optimization  

---

## 🎯 Overview

This document covers frontend performance improvements including bundle optimization, React performance patterns, and image handling.

---

## 🔴 Critical Issues

### 1. Bundle Size Optimization ✅ **COMPLETED**

#### Current Issues
- Large initial bundle sizes
- Insufficient code splitting
- Missing tree-shaking optimizations
- Duplicate dependencies

#### Status
**Implementation Date:** January 2025  
**Status:** ✅ Completed  
**Changes Made:**
- ✅ Added manual code splitting for vendor libraries in `vite.config.ts`
- ✅ Configured minification with esbuild
- ✅ Fixed dependencies: moved `ts-node` to devDependencies, added `zod` to dependencies
- ✅ React Router 7 automatically handles route-based code splitting

#### Analysis
```bash
# Analyze current bundle
ANALYZE=true npm run build
# Check dist/stats.html for visualization
```

#### Solutions

**A. Manual Code Splitting** ✅ **IMPLEMENTED**
```typescript
// vite.config.ts - IMPLEMENTED
export default defineConfig({
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes("node_modules")) {
            // React core
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
              return "react-vendor"
            }
            // React Query
            if (id.includes("@tanstack/react-query") || id.includes("@tanstack/react-query-devtools")) {
              return "react-query-vendor"
            }
            // Form validation
            if (id.includes("@conform-to") || id.includes("zod")) {
              return "form-vendor"
            }
            // i18n
            if (id.includes("i18next") || id.includes("react-i18next")) {
              return "i18n-vendor"
            }
            // Charts
            if (id.includes("chart.js") || id.includes("react-chartjs-2")) {
              return "chart-vendor"
            }
            // Animation
            if (id.includes("gsap")) {
              return "animation-vendor"
            }
            // Other vendor code
            return "vendor"
          }
        },
        chunkFileNames: "assets/[name]-[hash].js"
      }
    },
    
    // Minification - using esbuild (faster than terser)
    minify: "esbuild"
  }
})
```

**Note:** React Router 7 automatically handles route-based code splitting, so manual lazy loading of routes is not necessary.

**B. Lazy Load Heavy Routes** ✅ **AUTOMATIC**
React Router 7 automatically code-splits all routes, so manual lazy loading is not required. Routes are loaded on-demand when navigated to.

**Note:** The framework handles route-based code splitting automatically, providing optimal performance without manual configuration.

**C. Remove Unused Dependencies** ✅ **COMPLETED**
```json
// package.json - FIXED
{
  "dependencies": {
    // ✅ Fixed: Added zod (was missing but used throughout codebase)
    "zod": "^3.24.1",
    
    // ✅ Fixed: ts-node moved to devDependencies
    // ✅ Verified: serverless-http is used in api/server.js (kept)
    // ✅ Verified: moment is not used (date-fns is used instead)
  },
  "devDependencies": {
    // ✅ Moved: ts-node moved here from dependencies
    "ts-node": "^10.9.2"
  }
}
```

**Estimated Bundle Size Reduction:** 35-50%  
**Implementation Effort:** 2-3 days  
**Actual Time:** ~1 hour  
**Status:** ✅ All optimizations implemented

---

### 2. React Performance Optimization

#### Current Issues
- Unnecessary re-renders
- Missing React.memo usage
- No React Compiler optimization ✅ **FIXED**
- Inefficient list rendering

#### Solutions

**A. Enable React Compiler** (React 19) ✅ **IMPLEMENTED**
```typescript
// vite.config.ts - IMPLEMENTED
import babel from "vite-plugin-babel"

export default defineConfig({
  plugins: [
    // React Compiler - automatically optimizes React components
    babel({
      filter: /\.[jt]sx?$/,
      babelConfig: {
        presets: ["@babel/preset-typescript"],
        plugins: [
          [
            "babel-plugin-react-compiler",
            {
              compilationMode: "infer" // Automatically optimize components without manual annotations
            }
          ]
        ]
      }
    }),
    reactRouter()
  ]
})
```

**Status:** ✅ Enabled  
**Configuration Mode:** `infer` - Automatically optimizes all components without requiring manual annotations  
**Benefits:**
- Automatic memoization of components and values
- Reduced need for manual `useMemo`, `useCallback`, and `React.memo`
- Improved performance without code changes
- Works seamlessly with React 19

**B. Optimize Component Re-renders**
```typescript
// ❌ BEFORE: Unnecessary re-renders
export function PerfumeList({ perfumes }: { perfumes: Perfume[] }) {
  const [filter, setFilter] = useState("")
  
  const filteredPerfumes = perfumes.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  ) // Runs on every render!
  
  return (
    <div>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      {filteredPerfumes.map(p => <PerfumeCard key={p.id} perfume={p} />)}
    </div>
  )
}

// ✅ AFTER: Optimized with useMemo and React.memo
export const PerfumeList = memo(function PerfumeList({ 
  perfumes 
}: { perfumes: Perfume[] }) {
  const [filter, setFilter] = useState("")
  
  const filteredPerfumes = useMemo(
    () => perfumes.filter(p =>
      p.name.toLowerCase().includes(filter.toLowerCase())
    ),
    [perfumes, filter] // Only recompute when these change
  )
  
  const handleFilterChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setFilter(e.target.value),
    []
  )
  
  return (
    <div>
      <input value={filter} onChange={handleFilterChange} />
      {filteredPerfumes.map(p => <PerfumeCard key={p.id} perfume={p} />)}
    </div>
  )
})

// Memoize child components
const PerfumeCard = memo(function PerfumeCard({ 
  perfume 
}: { perfume: Perfume }) {
  return <div>{perfume.name}</div>
})
```

**C. Virtual Scrolling for Large Lists**
```typescript
// Already exists in codebase! Use it more:
// app/components/Atoms/VirtualScroll/VirtualScroll.tsx

export function PerfumeListVirtualized({ perfumes }: { perfumes: Perfume[] }) {
  return (
    <VirtualScroll
      items={perfumes}
      itemHeight={120}
      renderItem={(perfume) => (
        <PerfumeCard key={perfume.id} perfume={perfume} />
      )}
      overscan={5}
      className="h-screen"
    />
  )
}
```

**Estimated Re-render Reduction:** 60-80%  
**Implementation Effort:** 3-4 days

---

### 3. Image Optimization

#### Current Issues
- No CDN integration
- Missing responsive images
- No lazy loading strategy
- Large image file sizes

#### Solutions

**A. Responsive Images with srcset**
```typescript
// app/components/Atoms/OptimizedImage/OptimizedImage.tsx
interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)
  
  // Generate responsive image URLs
  const srcSet = [320, 640, 768, 1024, 1280]
    .map(w => `${src}?w=${w}&q=80 ${w}w`)
    .join(", ")
  
  return (
    <div className="relative">
      {!isLoaded && <ImagePlaceholder width={width} height={height} />}
      
      <img
        src={src}
        srcSet={srcSet}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        className={`transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
      
      {error && <ImageErrorFallback />}
    </div>
  )
}
```

**B. Image CDN Integration**
```typescript
// app/utils/image-cdn.ts
const IMAGE_CDN = process.env.IMAGE_CDN_URL || ""

export function generateImageUrl(
  path: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: "webp" | "avif" | "jpeg"
  } = {}
) {
  const { width, height, quality = 80, format = "webp" } = options
  
  if (!IMAGE_CDN) return path
  
  const params = new URLSearchParams()
  if (width) params.set("w", width.toString())
  if (height) params.set("h", height.toString())
  params.set("q", quality.toString())
  params.set("f", format)
  
  return `${IMAGE_CDN}${path}?${params.toString()}`
}

// Usage
<img src={generateImageUrl("/images/perfume.jpg", { width: 400, format: "webp" })} />
```

**C. WebP Conversion Script**
```bash
# Already exists! Use it more:
npm run convert:png-to-webp
npm run optimize:images
```

**Estimated Image Load Time Reduction:** 60-70%  
**Implementation Effort:** 1-2 days

---

### 4. CSS & Tailwind Optimization

#### Current Issues
- Potentially unused Tailwind classes
- No critical CSS extraction
- Large CSS bundle

#### Solutions

```typescript
// tailwind.config.ts
export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  
  // Safelist - only essential dynamic classes
  safelist: [
    /^bg-(red|green|blue|yellow|purple)-(50|100|200)$/,
    /^text-(red|green|blue|yellow|purple)-(600|700|800|900)$/
  ],
  
  theme: {
    extend: {
      colors: {
        "noir-black": "var(--noir-black)",
        "noir-white": "var(--noir-white)"
      }
    }
  },
  
  // Disable unused variants
  corePlugins: {
    preflight: true,
    container: false,
    float: false,
    clear: false
  }
}
```

---

## 📊 Implementation Checklist

- [x] ✅ Add code splitting for routes (React Router 7 automatic)
- [x] ✅ Configure manual chunks in Vite
- [x] ✅ Fix dependencies (ts-node, zod)
- [x] ✅ Enable React Compiler
- [ ] Add React.memo to list components (optional - React Compiler handles most cases)
- [ ] Implement useMemo for expensive calculations
- [ ] Use useCallback for event handlers
- [ ] Remove console.logs in production (requires terser or plugin)
- [ ] Set up image CDN
- [ ] Implement responsive images
- [ ] Add lazy loading for below-fold images
- [ ] Optimize Tailwind configuration
- [ ] Run bundle analyzer regularly

---

## 🎯 Expected Results

### Before Optimization
- Initial JS bundle: ~800KB (gzipped)
- First Contentful Paint: ~2.0s
- Time to Interactive: ~4.5s
- Re-renders: Excessive

### After Optimization
- Initial JS bundle: ~400KB (gzipped) ⚡
- First Contentful Paint: ~1.0s ⚡
- Time to Interactive: ~2.0s ⚡
- Re-renders: Optimized

### Performance Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Bundle size | 800KB | 400KB | 50% smaller |
| FCP | 2.0s | 1.0s | 50% faster |
| TTI | 4.5s | 2.0s | 56% faster |
| Re-renders | ~100/page | ~20/page | 80% reduction |
| Image load time | 1.5s | 0.5s | 67% faster |

---

## 📚 Additional Resources

- React 19 Compiler: https://react.dev/blog/2024/02/15/react-labs-what-we-have-been-working-on-february-2024
- Vite Performance: https://vitejs.dev/guide/performance
- Web.dev Performance: https://web.dev/performance/

---

**Next Steps:** See [API Optimization Guide](./03-API-OPTIMIZATION.md) for backend performance improvements.

