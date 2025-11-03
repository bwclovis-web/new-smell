# API Optimization Guide

**Date:** January 2025  
**Focus:** Response caching, compression, and API design  

---

## 🎯 Overview

This document covers API performance improvements including caching strategies, compression optimization, and response design.

---

## 🔴 Critical Issues

### 1. Response Caching & Headers

#### Current Issues
- Limited caching headers
- No ETag implementation
- Missing stale-while-revalidate pattern
- No CDN caching strategy

#### Solutions

**A. Enhanced Cache Headers**
```typescript
// app/routes/api/perfumes-by-letter.ts
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const letter = url.searchParams.get("letter")
  
  const perfumes = await getPerfumesByLetter(letter)
  
  return Response.json(perfumes, {
    headers: {
      // Cache for 10 minutes, revalidate in background
      "Cache-Control": "public, max-age=600, s-maxage=600, stale-while-revalidate=3600",
      
      // Vary header for proper caching
      "Vary": "Accept-Encoding, Accept-Language",
      
      // CORS if needed
      "Access-Control-Allow-Origin": "*"
    }
  })
}
```

**B. ETag Implementation**
```typescript
// app/utils/server/etag.server.ts
import crypto from "crypto"

export function generateETag(data: any): string {
  const hash = crypto
    .createHash("md5")
    .update(JSON.stringify(data))
    .digest("hex")
  return `"${hash}"`
}

export function checkETag(request: Request, etag: string): boolean {
  const ifNoneMatch = request.headers.get("if-none-match")
  return ifNoneMatch === etag
}

// Usage in loader
export async function loader({ request }: LoaderFunctionArgs) {
  const data = await fetchData()
  const etag = generateETag(data)
  
  if (checkETag(request, etag)) {
    return new Response(null, { status: 304 })
  }
  
  return Response.json(data, {
    headers: { ETag: etag }
  })
}
```

**C. Stale-While-Revalidate**
```typescript
// Cache-aware loader
export async function loader({ request }: LoaderFunctionArgs) {
  const cacheKey = generateCacheKey(request)
  const cached = await getCachedData(cacheKey)
  
  if (cached) {
    // Return stale data immediately, refresh in background
    refreshInBackground(cacheKey, fetchFreshData)
    return Response.json(cached.data, {
      headers: {
        "Cache-Control": "public, max-age=600, stale-while-revalidate=3600"
      }
    })
  }
  
  const fresh = await fetchFreshData()
  await setCachedData(cacheKey, fresh)
  
  return Response.json(fresh)
}
```

**Estimated API Response Time Reduction:** 40-60%  
**Implementation Effort:** 2 days

---

### 2. Compression Optimization

#### Current Status ✅

Already implemented in `api/server.js` with:
- Gzip compression (level 6)
- Threshold: 1KB
- Compression middleware applied

#### Enhancements

**A. Route-Specific Compression**
```typescript
// api/server.js
import compression from "compression"

// General compression
app.use(compression({
  threshold: 1024,
  level: 6
}))

// Higher compression for API responses
app.use(
  "/api",
  compression({
    level: 7, // Higher compression
    threshold: 512, // Compress smaller responses
    filter: (req, res) => {
      // Only compress JSON and text
      return compression.filter(req, res) && 
             req.path.startsWith("/api")
    }
  })
)

// Analytics data compression
app.use(
  "/api/analytics",
  compression({
    level: 9, // Maximum compression for analytics
    memLevel: 9
  })
)
```

**B. Brotli Compression** (Better than Gzip)
```typescript
import brotli from "compression-brotli"

app.use(
  brotli({
    filter: (req, res) => {
      const contentType = res.getHeader("Content-Type")
      return typeof contentType === "string" &&
             contentType.startsWith("application/json")
    },
    quality: 6 // Balance between size and speed
  })
)
```

**Estimated Compression Gain:** 10-20% additional size reduction  
**Implementation Effort:** 1 day

---

### 3. Response Design & Pagination

#### Current Issues
- Missing cursor-based pagination
- No field selection
- Inefficient data transfer

#### Solutions

**A. Cursor-Based Pagination**
```typescript
// app/routes/api/perfumes.ts
interface PaginationParams {
  cursor?: string
  limit?: number
  sortBy?: "name" | "createdAt"
  order?: "asc" | "desc"
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const cursor = url.searchParams.get("cursor")
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100)
  const sortBy = (url.searchParams.get("sortBy") || "createdAt") as "name" | "createdAt"
  const order = (url.searchParams.get("order") || "desc") as "asc" | "desc"
  
  // Cursor-based pagination (more efficient)
  const perfumes = await prisma.perfume.findMany({
    take: limit + 1, // Fetch one extra to check for more
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { [sortBy]: order },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      perfumeHouse: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  })
  
  const hasMore = perfumes.length > limit
  const items = hasMore ? perfumes.slice(0, -1) : perfumes
  const nextCursor = hasMore ? items[items.length - 1]?.id : null
  
  return Response.json({
    items,
    pagination: {
      nextCursor,
      hasMore,
      limit
    }
  })
}
```

**B. Field Selection**
```typescript
// Allow clients to specify fields
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const fields = url.searchParams.get("fields")?.split(",")
  
  const select = fields?.reduce((acc, field) => {
    acc[field] = true
    return acc
  }, {} as Record<string, boolean>) || {
    id: true,
    name: true,
    slug: true
  }
  
  const perfumes = await prisma.perfume.findMany({ select })
  return Response.json(perfumes)
}

// Usage: GET /api/perfumes?fields=id,name,slug,perfumeHouse.name
```

**Estimated Payload Size Reduction:** 40-60%  
**Implementation Effort:** 2-3 days

---

### 4. Rate Limiting Optimization

#### Current Status ✅

Already implemented with:
- Express-rate-limit middleware
- Multiple limit tiers
- IP-based tracking

#### Enhancements

**A. Sliding Window with Redis**
```typescript
import { rateLimit } from "express-rate-limit"
import RedisStore from "rate-limit-redis"

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || "6379")
})

const slidingWindowRateLimit = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: "rl:"
  }),
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
})
```

**B. User-Tier Based Limits**
```typescript
const tierBasedRateLimit = (req, res, next) => {
  const user = req.user
  const limits = {
    free: 100,
    premium: 1000,
    admin: 10000
  }
  
  const max = limits[user?.tier || "free"]
  
  return rateLimit({ max, windowMs: 60 * 1000 })(req, res, next)
}
```

---

## 📊 Implementation Checklist

- [ ] Add Cache-Control headers to all API routes
- [ ] Implement ETag support
- [ ] Use stale-while-revalidate pattern
- [ ] Configure CDN caching
- [ ] Add Brotli compression
- [ ] Implement cursor-based pagination
- [ ] Add field selection support
- [ ] Set up Redis for rate limiting
- [ ] Create tier-based rate limits
- [ ] Add response time monitoring

---

## 🎯 Expected Results

### Before Optimization
- Average response time: 200-400ms
- Payload size: Large
- Cache hit rate: 0%
- Repeated queries: Common

### After Optimization
- Average response time: 50-100ms ⚡
- Payload size: 40-60% smaller ⚡
- Cache hit rate: 70-85% ⚡
- Repeated queries: Cached ⚡

### Performance Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| API response time | 250ms | 75ms | 70% faster |
| Payload size | 100KB | 40KB | 60% smaller |
| Cache hit rate | 0% | 80% | ∞ improvement |
| Bandwidth usage | High | Medium | 50% reduction |

---

## 📚 Additional Resources

- HTTP Caching Guide: https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching
- ETag Best Practices: https://www.mnot.net/blog/2007/05/11#caching
- CDN Configuration: https://vercel.com/docs/concepts/edge-network/caching

---

**Next Steps:** See [Code Quality Guide](./04-CODE-QUALITY.md) for cleanup and refactoring improvements.

