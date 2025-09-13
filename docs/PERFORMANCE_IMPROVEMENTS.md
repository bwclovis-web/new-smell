# Performance Improvements for Voodoo Perfumes

## Current Performance Analysis

### Strengths

- ✅ Vite build optimization with compression
- ✅ Image optimization with WebP format
- ✅ Bundle splitting and code splitting
- ✅ Service worker implementation
- ✅ Prometheus metrics collection
- ✅ Local caching with `useHousesWithLocalCache`

### Areas for Improvement

- 🔄 Database query optimization needed
- 🔄 Missing Redis caching layer
- 🔄 Inefficient data fetching patterns
- 🔄 Large bundle sizes in some areas
- 🔄 Missing CDN implementation

## Database Performance Optimizations

### 1. Query Optimization

```typescript
// Create app/utils/database/query-optimizer.ts
export class QueryOptimizer {
  static async getPerfumesWithHouses(limit = 20, offset = 0) {
    return prisma.perfume.findMany({
      take: limit,
      skip: offset,
      include: {
        perfumeHouse: {
          select: {
            id: true,
            name: true,
            country: true,
            type: true,
          },
        },
        _count: {
          select: {
            userPerfumeRating: true,
            userPerfumeWishlist: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getPerfumeRatings(perfumeId: string) {
    return prisma.userPerfumeRating.aggregate({
      where: { perfumeId },
      _avg: {
        longevity: true,
        sillage: true,
        gender: true,
        priceValue: true,
        overall: true,
      },
      _count: true,
    });
  }
}
```

### 2. Database Indexing Strategy

```sql
-- Add to prisma/migrations/add_performance_indexes.sql
CREATE INDEX CONCURRENTLY idx_perfume_house_type ON "PerfumeHouse"("type");
CREATE INDEX CONCURRENTLY idx_perfume_created_at ON "Perfume"("createdAt");
CREATE INDEX CONCURRENTLY idx_perfume_house_id ON "Perfume"("perfumeHouseId");
CREATE INDEX CONCURRENTLY idx_user_perfume_rating_perfume ON "UserPerfumeRating"("perfumeId");
CREATE INDEX CONCURRENTLY idx_user_perfume_rating_user ON "UserPerfumeRating"("userId");
CREATE INDEX CONCURRENTLY idx_user_perfume_wishlist_user ON "UserPerfumeWishlist"("userId");
CREATE INDEX CONCURRENTLY idx_user_perfume_wishlist_perfume ON "UserPerfumeWishlist"("perfumeId");

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_perfume_house_type_created ON "PerfumeHouse"("type", "createdAt");
CREATE INDEX CONCURRENTLY idx_user_perfume_rating_composite ON "UserPerfumeRating"("userId", "perfumeId");
```

### 3. Connection Pooling

```typescript
// Update app/db.server.ts
import { PrismaClient } from "@prisma/client";

const prisma = singleton(
  "prisma",
  () =>
    new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
      // Connection pooling configuration
      __internal: {
        engine: {
          connectTimeout: 60000,
          queryTimeout: 30000,
        },
      },
    })
);

// Add connection health check
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "healthy", timestamp: new Date() };
  } catch (error) {
    return { status: "unhealthy", error: error.message, timestamp: new Date() };
  }
}
```

## Caching Strategy Implementation

### 1. Redis Integration

```typescript
// Create app/utils/cache/redis.server.ts
import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

export class CacheManager {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  static async set(key: string, value: any, ttl = 3600): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  static async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
  }
}
```

### 2. Smart Caching Hooks

```typescript
// Create app/hooks/useSmartCache.ts
import { useState, useEffect, useCallback } from "react";
import { CacheManager } from "~/utils/cache/redis.server";

interface CacheOptions {
  ttl?: number;
  staleWhileRevalidate?: boolean;
  tags?: string[];
}

export function useSmartCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { ttl = 3600, staleWhileRevalidate = true, tags = [] } = options;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try cache first
      const cached = await CacheManager.get<T>(key);
      if (cached && !staleWhileRevalidate) {
        setData(cached);
        setLoading(false);
        return;
      }

      // If stale-while-revalidate, return cached data immediately
      if (cached && staleWhileRevalidate) {
        setData(cached);
      }

      // Fetch fresh data
      const freshData = await fetcher();
      setData(freshData);

      // Cache the fresh data
      await CacheManager.set(key, freshData, ttl);

      // Tag for cache invalidation
      if (tags.length > 0) {
        await CacheManager.set(`tags:${key}`, tags, ttl);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl, staleWhileRevalidate, tags]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const invalidate = useCallback(async () => {
    await CacheManager.invalidate(key);
    await fetchData();
  }, [key, fetchData]);

  return { data, loading, error, refetch: fetchData, invalidate };
}
```

### 3. Cache Invalidation Strategy

```typescript
// Create app/utils/cache/invalidation.server.ts
export class CacheInvalidation {
  static async invalidatePerfume(perfumeId: string) {
    const patterns = [
      `perfume:${perfumeId}:*`,
      `perfume:list:*`,
      `perfume:search:*`,
      `perfume:ratings:${perfumeId}:*`,
    ];

    for (const pattern of patterns) {
      await CacheManager.invalidate(pattern);
    }
  }

  static async invalidateUser(userId: string) {
    const patterns = [
      `user:${userId}:*`,
      `user:perfumes:${userId}:*`,
      `user:wishlist:${userId}:*`,
    ];

    for (const pattern of patterns) {
      await CacheManager.invalidate(pattern);
    }
  }

  static async invalidateByTags(tags: string[]) {
    for (const tag of tags) {
      await CacheManager.invalidate(`tag:${tag}:*`);
    }
  }
}
```

## Frontend Performance Optimizations

### 1. Virtual Scrolling for Large Lists

```typescript
// Create app/components/Atoms/VirtualList/VirtualList.tsx
import { FixedSizeList as List } from "react-window";

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (props: {
    index: number;
    style: React.CSSProperties;
    item: T;
  }) => React.ReactNode;
}

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
}: VirtualListProps<T>) {
  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      itemData={items}
    >
      {({ index, style, data }) =>
        renderItem({ index, style, item: data[index] })
      }
    </List>
  );
}
```

### 2. Image Optimization Component

```typescript
// Create app/components/Atoms/OptimizedImage/OptimizedImage.tsx
import { useState, useCallback } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  // Generate responsive image sources
  const generateSrcSet = (baseSrc: string) => {
    const sizes = [320, 640, 768, 1024, 1280, 1536];
    return sizes.map((size) => `${baseSrc}?w=${size}&q=80 ${size}w`).join(", ");
  };

  if (error) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500">Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      srcSet={generateSrcSet(src)}
      alt={alt}
      width={width}
      height={height}
      className={`transition-opacity duration-300 ${
        loaded ? "opacity-100" : "opacity-0"
      } ${className}`}
      onLoad={handleLoad}
      onError={handleError}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}
```

### 3. Bundle Optimization

```typescript
// Update vite.config.ts
export default defineConfig({
  // ... existing config
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "react-vendor": ["react", "react-dom"],
          "router-vendor": ["react-router", "react-router-dom"],
          "ui-vendor": ["tailwindcss", "clsx", "class-variance-authority"],
          "chart-vendor": ["chart.js", "react-chartjs-2"],
          "i18n-vendor": [
            "i18next",
            "react-i18next",
            "i18next-browser-languagedetector",
          ],

          // Feature chunks
          "perfume-features": [
            "./app/components/Containers/Perfume",
            "./app/components/Containers/DataQualityDashboard",
          ],
          "admin-features": [
            "./app/routes/admin",
            "./app/components/Molecules/AdminNavigation",
          ],
          "rating-features": [
            "./app/components/Containers/Perfume/PerfumeRatingSystem",
          ],
        },
      },
    },
    // Enable tree shaking
    treeshake: {
      moduleSideEffects: false,
    },
  },
});
```

## API Performance Optimizations

### 1. Response Compression

```typescript
// Update api/server.js
import compression from "compression";

app.use(
  compression({
    level: 6,
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);
```

### 2. API Response Caching

```typescript
// Create app/utils/api/cache-headers.server.ts
export function setCacheHeaders(res: Response, maxAge = 3600, isPublic = true) {
  const cacheControl = isPublic
    ? `public, max-age=${maxAge}, stale-while-revalidate=86400`
    : `private, max-age=${maxAge}`;

  res.headers.set("Cache-Control", cacheControl);
  res.headers.set("ETag", generateETag(res.body));
  res.headers.set("Last-Modified", new Date().toUTCString());
}

export function generateETag(body: any): string {
  const content = typeof body === "string" ? body : JSON.stringify(body);
  return `"${Buffer.from(content).toString("base64").slice(0, 16)}"`;
}
```

### 3. Database Query Batching

```typescript
// Create app/utils/database/batch-queries.server.ts
export class BatchQueryManager {
  private queries: Array<{ key: string; query: () => Promise<any> }> = [];
  private results: Map<string, any> = new Map();

  addQuery(key: string, query: () => Promise<any>) {
    this.queries.push({ key, query });
  }

  async execute(): Promise<Map<string, any>> {
    const promises = this.queries.map(async ({ key, query }) => {
      try {
        const result = await query();
        this.results.set(key, result);
        return { key, result };
      } catch (error) {
        console.error(`Batch query error for ${key}:`, error);
        this.results.set(key, null);
        return { key, result: null };
      }
    });

    await Promise.allSettled(promises);
    return this.results;
  }

  getResult(key: string) {
    return this.results.get(key);
  }
}
```

## Monitoring and Metrics

### 1. Performance Monitoring

```typescript
// Create app/utils/performance/monitor.server.ts
export class PerformanceMonitor {
  static trackQuery(queryName: string, startTime: number) {
    const duration = Date.now() - startTime;
    console.log(`Query ${queryName} took ${duration}ms`);

    // Send to monitoring service
    if (process.env.MONITORING_ENABLED === "true") {
      // Send metrics to your monitoring service
    }
  }

  static trackApiCall(
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number
  ) {
    console.log(`API ${method} ${endpoint} - ${statusCode} - ${duration}ms`);

    // Track Core Web Vitals
    if (typeof window !== "undefined") {
      // Client-side performance tracking
    }
  }
}
```

### 2. Bundle Analysis

```typescript
// Create scripts/analyze-bundle.js
import { analyze } from "webpack-bundle-analyzer";

const analyzeBundle = async () => {
  const stats = await analyze({
    analyzerMode: "static",
    reportFilename: "bundle-analysis.html",
    openAnalyzer: false,
  });

  console.log("Bundle analysis complete. Check bundle-analysis.html");
};

analyzeBundle();
```

## Implementation Roadmap

### Phase 1 (Week 1-2): Database & Caching

1. Implement Redis caching layer
2. Add database indexes
3. Optimize critical queries
4. Implement query batching

### Phase 2 (Week 3-4): Frontend Optimizations

1. Implement virtual scrolling
2. Add image optimization
3. Optimize bundle splitting
4. Implement smart caching hooks

### Phase 3 (Week 5-6): API & Monitoring

1. Add response compression
2. Implement API caching
3. Set up performance monitoring
4. Add bundle analysis

### Phase 4 (Week 7-8): Advanced Features

1. Implement CDN integration
2. Add service worker optimizations
3. Set up automated performance testing
4. Implement advanced caching strategies

## Performance Targets

### Core Web Vitals

- **LCP**: < 2.5s (target: < 1.5s)
- **FID**: < 100ms (target: < 50ms)
- **CLS**: < 0.1 (target: < 0.05)

### Bundle Size

- **Initial Bundle**: < 200KB gzipped
- **Total Bundle**: < 1MB gzipped
- **Chunk Size**: < 100KB per chunk

### Database Performance

- **Query Response Time**: < 100ms for 95th percentile
- **Cache Hit Rate**: > 80%
- **Database Connection Pool**: 10-20 connections

### API Performance

- **Response Time**: < 200ms for 95th percentile
- **Throughput**: > 1000 requests/minute
- **Error Rate**: < 0.1%

## Testing Performance

### Load Testing

```bash
# Install artillery
npm install -g artillery

# Create load test
artillery quick --count 100 --num 10 http://localhost:2112/api/perfumes
```

### Performance Testing

```typescript
// Create test/performance/performance.test.ts
import { describe, it, expect } from "vitest";

describe("Performance Tests", () => {
  it("should load perfume list within 200ms", async () => {
    const start = Date.now();
    const response = await fetch("/api/perfumes");
    const duration = Date.now() - start;

    expect(response.ok).toBe(true);
    expect(duration).toBeLessThan(200);
  });
});
```

## Tools and Resources

### Monitoring Tools

- **Prometheus + Grafana**: Metrics collection and visualization
- **New Relic**: Application performance monitoring
- **Sentry**: Error tracking and performance monitoring

### Performance Tools

- **Lighthouse**: Web performance auditing
- **WebPageTest**: Real-world performance testing
- **Bundle Analyzer**: Bundle size analysis

### Database Tools

- **pg_stat_statements**: PostgreSQL query analysis
- **Redis Commander**: Redis monitoring and management
- **Prisma Studio**: Database management and query analysis
