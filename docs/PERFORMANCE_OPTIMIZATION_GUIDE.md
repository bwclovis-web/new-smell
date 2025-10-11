# Performance Optimization Guide

## Executive Summary

Comprehensive performance optimization strategies for the New Smell perfume trading platform, targeting improvements in database queries, frontend rendering, API responses, and asset delivery.

**Current Performance Baseline:**

- ✅ Good: Compression enabled (gzip level 6)
- ✅ Good: Image optimization (WebP)
- ✅ Good: React 19 with compiler support
- ⚠️ Needs Work: Database query optimization
- ⚠️ Needs Work: Bundle size reduction
- ⚠️ Needs Work: API response caching

**Target Performance Goals:**

- First Contentful Paint (FCP): < 1.2s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1
- First Input Delay (FID): < 100ms

---

## 1. Database Optimization

### 1.1 Query Analysis & N+1 Problem Resolution

**Impact:** 🔥 HIGH | **Effort:** ⏱️ 3-5 days | **Priority:** CRITICAL

#### Current N+1 Query Issues

```typescript
// ❌ BEFORE: N+1 Query in user.server.ts
export const getUserPerfumes = async (userId: string) => {
  const userPerfumes = await prisma.userPerfume.findMany({
    where: { userId },
    include: {
      perfume: {
        include: {
          perfumeHouse: true, // Causes additional query per perfume
        },
      },
      comments: {
        // Another N+1 for each perfume
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return userPerfumes;
};
```

```typescript
// ✅ AFTER: Optimized with proper relations
export const getUserPerfumes = async (userId: string) => {
  const userPerfumes = await prisma.userPerfume.findMany({
    where: { userId },
    select: {
      id: true,
      amount: true,
      available: true,
      price: true,
      perfume: {
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          perfumeHouse: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });
  return userPerfumes;
};
```

#### Identified N+1 Patterns

1. **`wishlist.server.ts:64-98`** - getUserWishlist with nested includes
2. **`user.server.ts:55-169`** - getTraderById with deep relations
3. **`house.server.ts:200-214`** - getPerfumeHouseBySlug with perfumes

#### Optimization Checklist

- [ ] Audit all Prisma queries with `prisma.$queryRaw` logging
- [ ] Replace `include` with selective `select` statements
- [ ] Add database indexes for frequently queried fields
- [ ] Implement query result caching
- [ ] Use `findUniqueOrThrow` for better error handling
- [ ] Add query performance monitoring

---

### 1.2 Database Indexing Strategy

**Impact:** 🔥 HIGH | **Effort:** ⏱️ 2-3 days | **Priority:** HIGH

#### Recommended Indexes

```prisma
// prisma/schema.prisma

model Perfume {
  id              String   @id @default(cuid())
  name            String   @unique
  slug            String   @unique
  perfumeHouseId  String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Add composite indexes for common queries
  @@index([perfumeHouseId, createdAt])
  @@index([slug, perfumeHouseId])
  @@index([name])  // For search queries
}

model UserPerfume {
  id        String  @id @default(cuid())
  userId    String
  perfumeId String
  available String  @default("0")

  // Optimize trading queries
  @@index([userId, available])
  @@index([perfumeId, available])
  @@index([available])  // For marketplace queries
}

model UserPerfumeWishlist {
  id        String   @id @default(cuid())
  userId    String
  perfumeId String
  createdAt DateTime @default(now())

  @@index([userId, createdAt])
  @@index([perfumeId])
}

model UserPerfumeRating {
  id        String @id @default(cuid())
  userId    String
  perfumeId String
  overall   Int?

  @@unique([userId, perfumeId])
  @@index([perfumeId, overall])  // For average rating queries
}
```

#### Migration Script

```sql
-- Add indexes for performance
CREATE INDEX CONCURRENTLY "idx_perfume_house_created"
ON "Perfume"("perfumeHouseId", "createdAt");

CREATE INDEX CONCURRENTLY "idx_user_perfume_available"
ON "UserPerfume"("available") WHERE "available" != '0';

CREATE INDEX CONCURRENTLY "idx_wishlist_user_created"
ON "UserPerfumeWishlist"("userId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY "idx_rating_perfume_overall"
ON "UserPerfumeRating"("perfumeId", "overall");
```

#### Checklist

- [ ] Analyze slow query logs
- [ ] Add indexes for foreign keys
- [ ] Create composite indexes for common queries
- [ ] Add partial indexes for filtered queries
- [ ] Monitor index usage with `pg_stat_user_indexes`
- [ ] Remove unused indexes

---

### 1.3 Query Caching Strategy

**Impact:** 🔥 HIGH | **Effort:** ⏱️ 3-4 days | **Priority:** HIGH

#### Multi-Layer Caching Architecture

```typescript
// app/utils/cache/query-cache.server.ts
import { LRUCache } from "lru-cache";

interface CacheOptions {
  ttl: number; // Time to live in ms
  max: number; // Max items in cache
}

const queryCache = new LRUCache<string, any>({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
  updateAgeOnGet: true,
  updateAgeOnHas: true,
});

export const withCache = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  const cached = queryCache.get(key);
  if (cached) return cached;

  const fresh = await fetcher();
  queryCache.set(key, fresh, { ttl });
  return fresh;
};

// Usage
export const getPerfumeHouseBySlug = async (slug: string) => {
  return withCache(
    `house:${slug}`,
    () =>
      prisma.perfumeHouse.findUnique({
        where: { slug },
        select: {
          id: true,
          name: true,
          description: true,
          // ...
        },
      }),
    1000 * 60 * 10 // Cache for 10 minutes
  );
};
```

#### Cache Invalidation Strategy

```typescript
// app/utils/cache/invalidation.server.ts
export const invalidateCache = {
  perfume: (perfumeId: string) => {
    queryCache.delete(`perfume:${perfumeId}`);
    queryCache.delete(`perfume:slug:*`);
  },

  house: (houseId: string) => {
    queryCache.delete(`house:${houseId}`);
    queryCache.delete(`house:slug:*`);
  },

  userPerfumes: (userId: string) => {
    queryCache.delete(`user:${userId}:perfumes`);
    queryCache.delete(`user:${userId}:wishlist`);
  },
};

// Invalidate on mutations
export const updatePerfume = async (id: string, data: any) => {
  const updated = await prisma.perfume.update({
    where: { id },
    data,
  });

  invalidateCache.perfume(id);
  return updated;
};
```

#### Caching Layers

1. **Memory Cache (LRU)**: Fast, in-process caching
2. **Redis Cache**: Shared across instances
3. **CDN Cache**: Static assets and API responses
4. **Browser Cache**: Client-side caching

#### Checklist

- [ ] Implement LRU cache for queries
- [ ] Add Redis for distributed caching
- [ ] Set up cache invalidation hooks
- [ ] Add cache monitoring
- [ ] Configure CDN caching headers
- [ ] Implement stale-while-revalidate

---

### 1.4 Database Connection Pooling

**Impact:** 🔥 MEDIUM | **Effort:** ⏱️ 1-2 days | **Priority:** MEDIUM

#### Optimized Connection Configuration

```typescript
// app/db.server.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],

  // Connection pool configuration
  __internal: {
    engine: {
      connection_limit: 10, // Max connections
      pool_timeout: 10, // Connection timeout (seconds)
    },
  },
});

// Prisma Accelerate for edge caching
// Use when DATABASE_URL includes prisma://
// Provides global connection pooling + caching
```

#### Prisma Accelerate Integration

```bash
# .env
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=..."
DIRECT_DATABASE_URL="postgresql://user:pass@host:5432/db"
```

```typescript
// Benefits of Prisma Accelerate:
// ✅ Global connection pooling
// ✅ Built-in query caching
// ✅ Edge deployment ready
// ✅ Automatic scaling
```

#### Checklist

- [ ] Configure connection pool size
- [ ] Set appropriate timeouts
- [ ] Monitor connection usage
- [ ] Consider Prisma Accelerate
- [ ] Implement connection retry logic
- [ ] Add connection health checks

---

## 2. Frontend Performance

### 2.1 Bundle Size Optimization

**Impact:** 🔥 HIGH | **Effort:** ⏱️ 4-6 days | **Priority:** HIGH

#### Current Bundle Analysis

```bash
# Analyze current bundle
ANALYZE=true npm run build

# Check dist/stats.html for visualization
```

#### Optimization Strategies

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "form-vendor": ["@conform-to/react", "@conform-to/zod"],
          "i18n-vendor": ["i18next", "react-i18next"],
          "chart-vendor": ["chart.js", "react-chartjs-2"],

          // Route-based chunks
          admin: [
            "./app/routes/admin/adminIndex.tsx",
            "./app/routes/admin/users.tsx",
            // ... other admin routes
          ],
        },
        chunkFileNames: "assets/[name]-[hash].js",
      },
    },

    // Minification
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info"],
      },
    },
  },

  // Tree-shaking
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
});
```

#### Code Splitting Strategy

```typescript
// app/routes.ts
import { lazy } from "react";

export default [
  layout("routes/RootLayout.tsx", [
    index("routes/home.tsx"),

    // Lazy load heavy routes
    route(
      "admin/*",
      lazy(() => import("./routes/admin/AdminLayout.tsx"))
    ),
    route(
      "the-vault",
      lazy(() => import("./routes/the-vault.tsx"))
    ),

    // Keep critical routes eager
    route("login/*", "routes/login/LoginLayout.tsx"),
  ]),
];
```

#### Remove Unused Dependencies

```json
// package.json - Audit and remove
{
  "dependencies": {
    // ❌ Check if these are actually used:
    "serverless-http": "^3.2.0",  // Only for AWS Lambda
    "ts-node": "^10.9.2",         // Dev dependency?

    // ✅ Consider lighter alternatives:
    "lodash": "^4.17.21"  → "lodash-es" (tree-shakeable)
    "moment": "^2.29.4"   → "date-fns" (already using!)
  }
}
```

#### Checklist

- [ ] Run bundle analyzer
- [ ] Implement code splitting
- [ ] Configure manual chunks
- [ ] Remove unused dependencies
- [ ] Use tree-shakeable imports
- [ ] Enable minification
- [ ] Measure before/after sizes
- [ ] Set bundle size budgets

---

### 2.2 React Performance Optimization

**Impact:** 🔥 HIGH | **Effort:** ⏱️ 5-7 days | **Priority:** HIGH

#### Enable React Compiler (React 19)

```typescript
// vite.config.ts
import babel from "vite-plugin-babel";

export default defineConfig({
  plugins: [
    babel({
      filter: /\.[jt]sx?$/,
      babelConfig: {
        presets: ["@babel/preset-typescript"],
        plugins: [
          [
            "babel-plugin-react-compiler",
            {
              // React Compiler options
              compilationMode: "annotation", // or 'all'
            },
          ],
        ],
      },
    }),
    reactRouter(),
  ],
});
```

#### Component Optimization Patterns

```typescript
// ❌ BEFORE: Unnecessary re-renders
export function PerfumeList({ perfumes }: Props) {
  const [filter, setFilter] = useState("");

  const filteredPerfumes = perfumes.filter((p) =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  ); // Runs on every render!

  return (
    <div>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      {filteredPerfumes.map((p) => (
        <PerfumeCard key={p.id} perfume={p} />
      ))}
    </div>
  );
}

// ✅ AFTER: Optimized with useMemo and React.memo
export const PerfumeList = memo(function PerfumeList({ perfumes }: Props) {
  const [filter, setFilter] = useState("");

  const filteredPerfumes = useMemo(
    () =>
      perfumes.filter((p) =>
        p.name.toLowerCase().includes(filter.toLowerCase())
      ),
    [perfumes, filter] // Only recompute when these change
  );

  const handleFilterChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setFilter(e.target.value),
    []
  );

  return (
    <div>
      <input value={filter} onChange={handleFilterChange} />
      {filteredPerfumes.map((p) => (
        <PerfumeCard key={p.id} perfume={p} />
      ))}
    </div>
  );
});

// Memoize child components
const PerfumeCard = memo(function PerfumeCard({
  perfume,
}: {
  perfume: Perfume;
}) {
  return <div>{perfume.name}</div>;
});
```

#### Virtual Scrolling for Large Lists

```typescript
// app/components/Organisms/VirtualizedPerfumeList.tsx
import { VirtualScroll } from "~/components/Atoms/VirtualScroll";

export function VirtualizedPerfumeList({ perfumes }: Props) {
  return (
    <VirtualScroll
      items={perfumes}
      itemHeight={120}
      renderItem={(perfume) => (
        <PerfumeCard key={perfume.id} perfume={perfume} />
      )}
      overscan={5}
    />
  );
}
```

#### Checklist

- [ ] Enable React Compiler
- [ ] Add useMemo for expensive calculations
- [ ] Use useCallback for event handlers
- [ ] Memoize components with React.memo
- [ ] Implement virtual scrolling for lists
- [ ] Use lazy loading for routes
- [ ] Profile with React DevTools
- [ ] Measure re-render counts

---

### 2.3 Image Optimization

**Impact:** 🔥 MEDIUM | **Effort:** ⏱️ 2-3 days | **Priority:** MEDIUM

#### Enhanced Image Loading

```typescript
// app/components/Atoms/OptimizedImage/OptimizedImage.tsx
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Generate responsive image URLs
  const srcSet = [320, 640, 768, 1024, 1280]
    .map((w) => `${src}?w=${w} ${w}w`)
    .join(", ");

  return (
    <div className="relative">
      {!isLoaded && <ImagePlaceholder width={width} height={height} />}

      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
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
  );
}
```

#### Image CDN Integration

```typescript
// app/utils/image-cdn.ts
const IMAGE_CDN = process.env.IMAGE_CDN_URL || "";

export function generateImageUrl(
  path: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "webp" | "avif" | "jpeg";
  } = {}
) {
  const { width, height, quality = 80, format = "webp" } = options;

  const params = new URLSearchParams();
  if (width) params.set("w", width.toString());
  if (height) params.set("h", height.toString());
  params.set("q", quality.toString());
  params.set("f", format);

  return `${IMAGE_CDN}${path}?${params.toString()}`;
}
```

#### Checklist

- [ ] Convert all images to WebP
- [ ] Implement responsive images with srcset
- [ ] Add lazy loading for below-fold images
- [ ] Use blur-up placeholders
- [ ] Set up image CDN (Cloudinary/Imgix)
- [ ] Add automatic format detection (WebP/AVIF)
- [ ] Optimize image sizes (< 100KB)
- [ ] Use SVG for icons

---

### 2.4 CSS & Style Optimization

**Impact:** 🔥 MEDIUM | **Effort:** ⏱️ 2-3 days | **Priority:** MEDIUM

#### Tailwind CSS Optimization

```typescript
// tailwind.config.ts
export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],

  // Remove unused classes
  safelist: [
    // Only include essential dynamic classes
    "bg-red-500",
    "bg-green-500",
    "bg-yellow-500",
  ],

  theme: {
    extend: {
      // Use CSS variables for theming
      colors: {
        "noir-black": "var(--noir-black)",
        "noir-white": "var(--noir-white)",
      },
    },
  },

  // Disable unused variants
  corePlugins: {
    preflight: true,
    container: false, // If not using
    float: false, // If not using
  },
};
```

#### Critical CSS Extraction

```typescript
// app/root.tsx
export const links: Route.LinksFunction = () => [
  // Inline critical CSS
  {
    rel: "stylesheet",
    href: "/critical.css",
    // Add as <style> tag for critical CSS
  },
  // Defer non-critical CSS
  {
    rel: "preload",
    href: "/app.css",
    as: "style",
    onload: "this.onload=null;this.rel='stylesheet'",
  },
];
```

#### Checklist

- [ ] Purge unused Tailwind classes
- [ ] Extract critical CSS
- [ ] Minimize custom CSS
- [ ] Use CSS containment
- [ ] Optimize font loading
- [ ] Remove duplicate styles
- [ ] Measure CSS bundle size

---

## 3. API Performance

### 3.1 Response Caching & Compression

**Impact:** 🔥 HIGH | **Effort:** ⏱️ 2-3 days | **Priority:** HIGH

#### Enhanced Caching Headers

```typescript
// app/routes/api/perfumes-by-letter.ts
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const letter = url.searchParams.get("letter");

  const perfumes = await getPerfumesByLetter(letter);

  return Response.json(perfumes, {
    headers: {
      // Cache for 10 minutes, revalidate in background
      "Cache-Control":
        "public, max-age=600, s-maxage=600, stale-while-revalidate=3600",

      // ETags for conditional requests
      ETag: generateETag(perfumes),

      // Vary header for proper caching
      Vary: "Accept-Encoding, Accept-Language",

      // CORS if needed
      "Access-Control-Allow-Origin": "*",
    },
  });
}
```

#### ETag Implementation

```typescript
// app/utils/server/etag.server.ts
import crypto from "crypto";

export function generateETag(data: any): string {
  const hash = crypto
    .createHash("md5")
    .update(JSON.stringify(data))
    .digest("hex");
  return `"${hash}"`;
}

export function checkETag(request: Request, etag: string): boolean {
  const ifNoneMatch = request.headers.get("if-none-match");
  return ifNoneMatch === etag;
}

// Usage in loader
export async function loader({ request }: LoaderFunctionArgs) {
  const data = await fetchData();
  const etag = generateETag(data);

  if (checkETag(request, etag)) {
    return new Response(null, { status: 304 });
  }

  return Response.json(data, {
    headers: { ETag: etag },
  });
}
```

#### Response Compression

```typescript
// api/server.js - Already implemented ✅
app.use(
  compression({
    threshold: 1024,
    level: 6,
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) return false;
      return compression.filter(req, res);
    },
    memLevel: 8,
    strategy: 0,
    windowBits: 15,
    chunkSize: 16 * 1024,
  })
);

// Enhance for specific routes
app.use(
  "/api",
  compression({
    level: 7, // Higher compression for API responses
    threshold: 512, // Compress smaller responses
  })
);
```

#### Checklist

- [ ] Add Cache-Control headers to all API routes
- [ ] Implement ETag support
- [ ] Use stale-while-revalidate
- [ ] Configure CDN caching
- [ ] Add response compression monitoring
- [ ] Implement conditional requests
- [ ] Test cache effectiveness

---

### 3.2 API Response Optimization

**Impact:** 🔥 HIGH | **Effort:** ⏱️ 3-4 days | **Priority:** HIGH

#### Pagination & Limiting

```typescript
// app/routes/api/perfumes.ts
interface PaginationParams {
  page: number;
  limit: number;
  cursor?: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
  const cursor = url.searchParams.get("cursor");

  // Cursor-based pagination (more efficient)
  const perfumes = await prisma.perfume.findMany({
    take: limit + 1, // Fetch one extra to check for more
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      perfumeHouse: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  const hasMore = perfumes.length > limit;
  const items = hasMore ? perfumes.slice(0, -1) : perfumes;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return Response.json({
    items,
    pagination: {
      nextCursor,
      hasMore,
      limit,
    },
  });
}
```

#### Response Field Selection

```typescript
// Allow clients to specify fields
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const fields = url.searchParams.get("fields")?.split(",");

  const select = fields?.reduce((acc, field) => {
    acc[field] = true;
    return acc;
  }, {} as any) || {
    id: true,
    name: true,
    slug: true,
  };

  const perfumes = await prisma.perfume.findMany({ select });
  return Response.json(perfumes);
}
```

#### Checklist

- [ ] Implement cursor-based pagination
- [ ] Add field selection support
- [ ] Limit response sizes
- [ ] Use GraphQL for complex queries
- [ ] Add response time monitoring
- [ ] Implement rate limiting per endpoint

---

### 3.3 Rate Limiting Optimization

**Impact:** 🔥 MEDIUM | **Effort:** ⏱️ 2-3 days | **Priority:** MEDIUM

#### Intelligent Rate Limiting

```typescript
// api/server.js - Current implementation is good ✅
// Enhancements:

// 1. Sliding window rate limiting
import { rateLimit } from "express-rate-limit";
import RedisStore from "rate-limit-redis";

const slidingWindowRateLimit = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: "rl:",
  }),
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  // Sliding window
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// 2. User-tier based limits
const tierBasedRateLimit = (req, res, next) => {
  const user = req.user;
  const limits = {
    free: 100,
    premium: 1000,
    admin: 10000,
  };

  const max = limits[user?.tier || "free"];

  return rateLimit({ max })(req, res, next);
};

// 3. Endpoint-specific limits
const endpointLimits = {
  "/api/search": { max: 50, windowMs: 60 * 1000 },
  "/api/perfumes": { max: 100, windowMs: 60 * 1000 },
  "/api/ratings": { max: 20, windowMs: 5 * 60 * 1000 },
};
```

#### Checklist

- [ ] Implement sliding window rate limiting
- [ ] Add Redis for distributed rate limiting
- [ ] Create user-tier based limits
- [ ] Add rate limit headers
- [ ] Monitor rate limit violations
- [ ] Implement graceful degradation

---

## 4. Build & Deployment

### 4.1 Build Optimization

**Impact:** 🔥 MEDIUM | **Effort:** ⏱️ 2-3 days | **Priority:** MEDIUM

#### Parallel Build Steps

```json
// package.json
{
  "scripts": {
    "build": "npm-run-all --parallel build:*",
    "build:client": "react-router build --mode client",
    "build:server": "react-router build --mode server",
    "build:images": "node scripts/copy-images.js",

    "prebuild": "npm run typecheck && npm run lint",
    "postbuild": "npm run analyze:bundle"
  }
}
```

#### Incremental Builds

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    // Faster rebuilds
    watch: process.env.WATCH === "true" ? {} : null,

    // Incremental builds
    rollupOptions: {
      cache: true,
    },
  },

  // Faster transpilation
  esbuild: {
    target: "es2022",
    logLevel: "error",
  },
});
```

#### Checklist

- [ ] Parallelize build steps
- [ ] Enable incremental builds
- [ ] Cache build artifacts
- [ ] Optimize TypeScript compilation
- [ ] Profile build time
- [ ] Set up build monitoring

---

### 4.2 Deployment Performance

**Impact:** 🔥 MEDIUM | **Effort:** ⏱️ 2-3 days | **Priority:** MEDIUM

#### Vercel Optimization (Current Platform)

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "framework": "react-router",
  "regions": ["iad1"], // Primary region

  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/images/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=86400, s-maxage=86400"
        }
      ]
    }
  ],

  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

#### Edge Functions

```typescript
// Consider moving hot paths to edge
// app/routes/api/perfume-search.edge.ts
export const config = {
  runtime: "edge",
};

export async function GET(request: Request) {
  // Runs on edge, closer to users
  const perfumes = await searchPerfumes(query);
  return Response.json(perfumes);
}
```

#### Checklist

- [ ] Configure edge regions
- [ ] Move hot APIs to edge functions
- [ ] Optimize asset caching
- [ ] Set up preview deployments
- [ ] Monitor deployment metrics
- [ ] Add rollback strategy

---

## 5. Monitoring & Metrics

### 5.1 Performance Monitoring

**Impact:** 🔥 HIGH | **Effort:** ⏱️ 3-4 days | **Priority:** HIGH

#### Web Vitals Tracking

```typescript
// app/entry.client.tsx
import { onCLS, onFID, onFCP, onLCP, onTTFB } from "web-vitals";

function sendToAnalytics(metric: Metric) {
  // Send to your analytics service
  fetch("/api/analytics", {
    method: "POST",
    body: JSON.stringify(metric),
  });
}

onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onFCP(sendToAnalytics);
onLCP(sendToAnalytics);
onTTFB(sendToAnalytics);
```

#### Performance Budget

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      // Warn if chunks are too large
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
      // Performance budget
      onwarn(warning, warn) {
        if (warning.code === "FILE_SIZE_WARNING") {
          console.error("Bundle size exceeded!");
        }
        warn(warning);
      },
    },
  },
});
```

#### Checklist

- [ ] Set up Web Vitals tracking
- [ ] Define performance budgets
- [ ] Add Lighthouse CI
- [ ] Monitor bundle sizes
- [ ] Track API response times
- [ ] Set up alerts for regressions

---

## 6. Quick Wins (Immediate Actions)

### Priority 1: Database (Week 1)

1. ✅ Add database indexes (2 hours)
2. ✅ Fix N+1 queries in wishlist (4 hours)
3. ✅ Implement query caching (1 day)

### Priority 2: Frontend (Week 2)

1. ✅ Enable React Compiler (4 hours)
2. ✅ Add code splitting (1 day)
3. ✅ Implement lazy loading (4 hours)

### Priority 3: API (Week 3)

1. ✅ Add response caching (4 hours)
2. ✅ Implement pagination (1 day)
3. ✅ Optimize compression (2 hours)

---

## 7. Performance Benchmarks

### Target Metrics

- **Time to First Byte (TTFB)**: < 200ms
- **First Contentful Paint (FCP)**: < 1.2s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Total Blocking Time (TBT)**: < 300ms
- **Cumulative Layout Shift (CLS)**: < 0.1

### API Performance

- **Average Response Time**: < 100ms
- **P95 Response Time**: < 300ms
- **P99 Response Time**: < 500ms
- **Database Query Time**: < 50ms

### Bundle Sizes

- **Initial JS**: < 200KB (gzipped)
- **Total JS**: < 500KB (gzipped)
- **CSS**: < 50KB (gzipped)
- **Images**: < 100KB each

---

## Next Steps

1. **Week 1**: Database optimization and indexing
2. **Week 2**: Frontend performance and bundle optimization
3. **Week 3**: API caching and response optimization
4. **Week 4**: Monitoring setup and validation

**Remember**: Measure first, optimize second, validate third!
