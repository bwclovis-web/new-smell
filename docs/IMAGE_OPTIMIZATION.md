# Image Optimization Guide

This document outlines the image optimization strategies implemented in the perfume app to improve loading performance and user experience.

## Overview

The app now includes several image optimization features:

- **OptimizedImage Component**: A smart image component with lazy loading, placeholders, and error handling
- **Image Preloading**: Critical image preloading for better perceived performance
- **Responsive Images**: Support for different screen sizes and formats
- **Progressive Loading**: Blur placeholders and loading states
- **PWA Support**: Service worker caching for images

## Components

### OptimizedImage

The main component for displaying optimized images throughout the app.

```tsx
import OptimizedImage from '~/components/Atoms/OptimizedImage'

// Basic usage
<OptimizedImage
  src="/path/to/image.webp"
  alt="Perfume description"
  width={300}
  height={300}
  className="rounded-lg"
/>

// With priority loading (for above-the-fold images)
<OptimizedImage
  src="/hero-image.webp"
  alt="Hero image"
  priority={true}
  className="w-full h-64"
/>

// With blur placeholder
<OptimizedImage
  src="/perfume-image.webp"
  alt="Perfume"
  placeholder="blur"
  blurDataURL="/low-quality-placeholder.jpg"
  className="w-48 h-48"
/>
```

### ImagePlaceholder

A component for showing loading states while images load.

```tsx
import ImagePlaceholder from '~/components/Atoms/ImagePlaceholder'

// Skeleton loading
<ImagePlaceholder
  width={300}
  height={300}
  variant="skeleton"
  className="rounded-lg"
/>

// With icon
<ImagePlaceholder
  width={200}
  height={200}
  variant="icon"
  icon={<PerfumeIcon />}
/>
```

### ImagePreloader

Preloads critical images for better performance.

```tsx
import ImagePreloader from '~/components/Atoms/ImagePreloader'

// High priority preloading
<ImagePreloader
  images={['/hero.webp', '/logo.webp']}
  priority="high"
/>

// Low priority preloading (when browser is idle)
<ImagePreloader
  images={['/gallery1.webp', '/gallery2.webp']}
  priority="low"
/>
```

## Implementation Examples

### Replacing Basic img Tags

**Before:**

```tsx
<img
  src={perfume.image}
  alt={perfume.name}
  className="w-48 h-48 object-cover"
/>
```

**After:**

```tsx
<OptimizedImage
  src={perfume.image}
  alt={perfume.name}
  width={192}
  height={192}
  className="w-48 h-48 object-cover"
  fallbackSrc="/placeholder-perfume.jpg"
/>
```

### Hero/Banner Images

**Before:**

```tsx
<img
  src={banner}
  alt=""
  className="hero-image absolute object-cover w-full h-full"
/>
```

**After:**

```tsx
<OptimizedImage
  src={banner}
  alt="Hero banner"
  priority={true}
  className="hero-image absolute object-cover w-full h-full"
/>
```

### Grid Images (with lazy loading)

**Before:**

```tsx
<img
  src={perfume.image}
  alt={perfume.name}
  loading="lazy"
  className="w-full h-full object-cover"
/>
```

**After:**

```tsx
<OptimizedImage
  src={perfume.image}
  alt={perfume.name}
  width={300}
  height={300}
  className="w-full h-full object-cover"
  placeholder="skeleton"
/>
```

## Best Practices

### 1. Image Sizing

- Always specify `width` and `height` to prevent layout shifts
- Use appropriate dimensions for the display context
- Consider responsive breakpoints

### 2. Priority Loading

- Use `priority={true}` for above-the-fold images
- Use `priority={false}` (default) for images below the fold
- Preload critical images in the root layout

### 3. Placeholders

- Use `placeholder="blur"` with `blurDataURL` for smooth transitions
- Use `placeholder="skeleton"` for loading states
- Consider using `placeholder="icon"` for decorative images

### 4. Error Handling

- Always provide a `fallbackSrc` for user-uploaded images
- Use meaningful `alt` text for accessibility
- Handle loading errors gracefully

### 5. Performance

- Use WebP format when possible (already implemented)
- Implement lazy loading for grid/list views
- Cache images with service worker (PWA)

## Migration Strategy

### Phase 1: Critical Images

1. Replace hero/banner images with `OptimizedImage`
2. Add image preloading to root layout
3. Update 404 and login pages

### Phase 2: Content Images

1. Replace perfume and house images in detail views
2. Update grid/list views with lazy loading
3. Add error handling and fallbacks

### Phase 3: Optimization

1. Implement responsive image sizes
2. Add blur placeholders where appropriate
3. Optimize image dimensions and quality

## Configuration

### Vite Config

The Vite configuration includes:

- PWA plugin for service worker caching
- Asset optimization and hashing
- Image format support

### Environment Variables

No additional environment variables are required for basic functionality.

### Build Process

Images are automatically:

- Hashed for cache busting
- Organized in the build output
- Optimized for production

## Monitoring and Analytics

### Performance Metrics

- **Largest Contentful Paint (LCP)**: Critical for hero images
- **Cumulative Layout Shift (CLS)**: Reduced with proper sizing
- **First Input Delay (FID)**: Improved with optimized loading

### Tools

- Lighthouse for performance auditing
- Chrome DevTools Network tab
- WebPageTest for real-world testing

## Troubleshooting

### Common Issues

1. **Images not loading**

   - Check fallback URLs
   - Verify image paths
   - Check network requests

2. **Layout shifts**

   - Ensure width/height are set
   - Use appropriate aspect ratios
   - Test on different screen sizes

3. **Performance issues**
   - Verify lazy loading is working
   - Check image file sizes
   - Monitor network requests

### Debug Mode

Enable debug logging by setting:

```tsx
// In development
console.log("Image loading:", { src, isLoaded, hasError });
```

## Future Enhancements

### Planned Features

- **AVIF format support**: Better compression than WebP
- **Dynamic image resizing**: Server-side image optimization
- **Art direction**: Different images for different screen sizes
- **Progressive JPEG**: Better perceived performance

### Integration Opportunities

- **CDN integration**: For external image hosting
- **Image compression API**: For user uploads
- **Analytics integration**: Track image loading performance

## Resources

- [Web.dev Image Optimization](https://web.dev/fast/#optimize-your-images)
- [MDN Responsive Images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
