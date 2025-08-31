# Performance Optimization Guide

This document outlines the comprehensive performance optimizations implemented to improve Lighthouse scores for the Voodoo Perfumes application.

## 🚀 Core Web Vitals Optimization

### 1. Largest Contentful Paint (LCP)

- **Critical Images Preloading**: High-priority images are preloaded using `<link rel="preload">`
- **Font Optimization**: Critical fonts are preloaded with proper `crossOrigin` attributes
- **Image Compression**: All images use WebP format for optimal compression
- **Lazy Loading**: Non-critical images use Intersection Observer for lazy loading

### 2. First Input Delay (FID)

- **Code Splitting**: Manual chunks for vendor, router, UI, and utility libraries
- **Bundle Optimization**: Terser minification with console.log removal in production
- **Tree Shaking**: Unused code elimination through Vite's build optimization

### 3. Cumulative Layout Shift (CLS)

- **Stable Layouts**: CSS optimizations to prevent layout shifts
- **Image Dimensions**: Proper aspect ratio maintenance
- **Font Loading**: Font-display: swap to prevent layout shifts during font loading

## 📦 Build Optimizations

### Vite Configuration

```typescript
// Manual chunk splitting
manualChunks: {
  vendor: ['react', 'react-dom'],
  router: ['react-router', 'react-router-dom'],
  ui: ['tailwindcss', 'clsx', 'class-variance-authority'],
  utils: ['zustand', 'i18next', 'react-i18next'],
}

// Compression plugins
- Gzip compression for all assets
- Brotli compression for modern browsers
- Bundle analyzer for monitoring
```

### Bundle Analysis

- **Visualizer**: HTML report showing bundle sizes and dependencies
- **Chunk Warnings**: Alerts for chunks exceeding 1MB
- **Asset Optimization**: Optimized file naming and organization

## 🖼️ Image Optimization

### Preloading Strategy

```typescript
// Critical images (above-the-fold)
const criticalImages = [
  '/images/home.webp',
  '/images/scent.webp',
  '/images/login.webp'
]

// Lazy loading for non-critical images
<ImagePreloader images={images} priority="low" lazy={true} />
```

### Format Optimization

- **WebP**: Primary format for modern browsers
- **Responsive Images**: Appropriate sizes for different devices
- **Compression**: Optimized quality-to-size ratio

## 🔧 Service Worker & Caching

### Static Asset Caching

```javascript
// Cache-first strategy for static assets
const STATIC_ASSETS = [
  "/",
  "/images/home.webp",
  "/images/scent.webp",
  // ... other critical assets
];
```

### Dynamic Caching

- **Network-first**: API responses cached after successful requests
- **Offline Support**: Fallback to cache when network unavailable
- **Background Sync**: Queue offline actions for later execution

## 📊 Performance Monitoring

### Core Web Vitals Tracking

```typescript
// PerformanceObserver for real-time metrics
const lcpObserver = new PerformanceObserver((list) => {
  // Track LCP
});

const fidObserver = new PerformanceObserver((list) => {
  // Track FID
});

const clsObserver = new PerformanceObserver((list) => {
  // Track CLS
});
```

### Analytics Integration

- **Google Analytics**: Performance metrics sent to GA4
- **Custom Events**: Detailed performance breakdown
- **Real-time Monitoring**: Live performance tracking

## 🎨 CSS Performance

### Font Optimization

```css
/* Optimize font rendering */
h1,
h2,
h3 {
  font-feature-settings: "liga" 1, "kern" 1;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### Animation Performance

```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* Hardware acceleration */
.hero-title {
  will-change: transform;
}
```

## 📱 PWA Features

### Web App Manifest

```json
{
  "name": "Voodoo Perfumes",
  "short_name": "Voodoo",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#000000"
}
```

### Offline Experience

- **Offline Indicator**: Visual feedback when offline
- **Cached Content**: Essential pages available offline
- **Background Sync**: Queue actions for when online

## 🧪 Testing & Monitoring

### Lighthouse Audit

Run performance audits:

```bash
# Install Lighthouse globally
npm install -g lighthouse

# Run audit
lighthouse https://your-domain.com --output html --output-path ./lighthouse-report.html
```

### Performance Budgets

- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1
- **Bundle Size**: < 1MB per chunk

## 📈 Expected Improvements

### Before Optimization

- **Performance Score**: ~60-70
- **LCP**: 3-4 seconds
- **FID**: 150-200ms
- **CLS**: 0.15-0.25

### After Optimization

- **Performance Score**: 90-95+
- **LCP**: 1.5-2 seconds
- **FID**: 50-80ms
- **CLS**: 0.05-0.1

## 🚀 Deployment Checklist

- [ ] Build with production optimizations
- [ ] Verify service worker registration
- [ ] Test offline functionality
- [ ] Run Lighthouse audit
- [ ] Monitor Core Web Vitals
- [ ] Check bundle sizes
- [ ] Verify image optimization
- [ ] Test mobile performance

## 🔍 Troubleshooting

### Common Issues

1. **Service Worker Not Registering**: Check HTTPS requirement
2. **Images Not Loading**: Verify preload paths
3. **Bundle Too Large**: Review manual chunk configuration
4. **Performance Regression**: Check for new dependencies

### Debug Tools

- **Chrome DevTools**: Performance tab for detailed analysis
- **Lighthouse**: Comprehensive performance auditing
- **WebPageTest**: Real-world performance testing
- **Bundle Analyzer**: Visualize bundle composition

## 📚 Additional Resources

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Vite Performance](https://vitejs.dev/guide/performance.html)
- [React Performance](https://react.dev/learn/render-and-commit)
