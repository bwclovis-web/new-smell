# User Interaction Tracking Implementation Guide

## Overview

This document provides step-by-step implementation guidance for the user interaction tracking system that will power AI recommendations and analytics.

**Status:** Implementation Guide  
**Version:** 1.0  
**Target Audience:** Full-stack developers  
**Estimated Effort:** 2-3 weeks

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backend Implementation](#backend-implementation)
3. [Frontend Implementation](#frontend-implementation)
4. [Data Pipeline](#data-pipeline)
5. [Testing Strategy](#testing-strategy)
6. [Deployment](#deployment)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (React)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Page Views  │  │ Interactions │  │  Engagement  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │  Analytics SDK │                        │
│                    └───────┬────────┘                        │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Event Queue    │
                    │  (In-memory)    │
                    └────────┬────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                  Backend API (Remix/Express)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │Event Ingestion│ │Event Validation│ │ Event Storage│       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         └──────────────────┼──────────────────┘               │
│                            │                                  │
│                    ┌───────▼────────┐                         │
│                    │  Prisma ORM    │                         │
│                    └───────┬────────┘                         │
└────────────────────────────┼──────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                   PostgreSQL Database                         │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │UserInteraction   │  │PerfumeInteraction│                 │
│  │Event             │  │Stats             │                 │
│  └──────────────────┘  └──────────────────┘                 │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │UserBehavior      │  │Recommendation    │                 │
│  │Profile           │  │Feedback          │                 │
│  └──────────────────┘  └──────────────────┘                 │
└──────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                   Aggregation Jobs (Cron)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │Hourly Stats  │  │Daily Profiles│  │Weekly Reports│       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

---

## Backend Implementation

### Step 1: Database Schema Migration

Create the necessary Prisma schema additions:

```bash
# Create migration file
cd prisma
```

Add to `schema.prisma`:

```prisma
// Add to existing schema.prisma
model UserInteractionEvent {
  id            String   @id @default(cuid())
  userId        String?
  sessionId     String
  eventType     InteractionEventType
  eventCategory InteractionCategory
  timestamp     DateTime @default(now())

  perfumeId     String?
  houseId       String?

  eventData     Json

  deviceType    String?
  userAgent     String?
  referrer      String?
  path          String

  duration      Int?
  value         Float?

  user          User?    @relation(fields: [userId], references: [id])
  perfume       Perfume? @relation(fields: [perfumeId], references: [id])
  house         PerfumeHouse? @relation(fields: [houseId], references: [id])

  @@index([userId, timestamp])
  @@index([sessionId, timestamp])
  @@index([eventType, timestamp])
  @@index([perfumeId, timestamp])
  @@index([userId, eventType, timestamp])
}

enum InteractionEventType {
  PAGE_VIEW
  PERFUME_VIEW
  HOUSE_VIEW
  SEARCH_PERFORMED
  SEARCH_RESULT_CLICKED
  FILTER_APPLIED
  RATING_COMPLETED
  REVIEW_SUBMITTED
  WISHLIST_ADD
  WISHLIST_REMOVE
  COLLECTION_ADD
  IMAGE_VIEWED
  NOTES_EXPANDED
  SIMILAR_CLICKED
}

enum InteractionCategory {
  VIEW
  SEARCH
  FILTER
  RATING
  REVIEW
  COLLECTION
  WISHLIST
  ENGAGEMENT
}

model UserSession {
  id              String   @id @default(cuid())
  sessionId       String   @unique
  userId          String?

  startTime       DateTime @default(now())
  endTime         DateTime?
  duration        Int?

  deviceType      String
  browser         String
  os              String

  pageViews       Int      @default(0)
  perfumesViewed  Int      @default(0)
  interactions    Int      @default(0)

  user            User?    @relation(fields: [userId], references: [id])

  @@index([userId, startTime])
}

model UserBehaviorProfile {
  id                      String   @id @default(cuid())
  userId                  String   @unique

  preferredNotes          Json
  preferredHouses         Json
  preferredPriceRange     Json

  totalSessions           Int      @default(0)
  totalPageViews          Int      @default(0)
  totalPerfumesViewed     Int      @default(0)
  avgSessionDuration      Float    @default(0)

  totalRatings            Int      @default(0)
  avgRatingValue          Float?

  collectionSize          Int      @default(0)
  wishlistSize            Int      @default(0)

  engagementScore         Float    @default(0)
  lastActiveDate          DateTime @default(now())

  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt

  user                    User     @relation(fields: [userId], references: [id])

  @@index([engagementScore])
  @@index([lastActiveDate])
}

model PerfumeInteractionStats {
  id                    String   @id @default(cuid())
  perfumeId             String   @unique

  totalViews            Int      @default(0)
  uniqueViewers         Int      @default(0)
  avgViewDuration       Float    @default(0)

  totalRatings          Int      @default(0)
  avgRating             Float?

  inWishlistCount       Int      @default(0)
  inCollectionCount     Int      @default(0)

  searchImpressions     Int      @default(0)
  searchClicks          Int      @default(0)

  viewsLast7Days        Int      @default(0)
  trendingScore         Float    @default(0)

  lastViewedAt          DateTime?
  updatedAt             DateTime @updatedAt

  perfume               Perfume  @relation(fields: [perfumeId], references: [id])

  @@index([trendingScore])
  @@index([totalViews])
}
```

Run migration:

```bash
npx prisma migrate dev --name add_interaction_tracking
```

### Step 2: Event Tracking Service

Create `app/models/analytics/interaction-tracking.server.ts`:

```typescript
import { prisma } from "~/db.server";
import type { InteractionEventType, InteractionCategory } from "@prisma/client";

export interface TrackEventParams {
  userId?: string;
  sessionId: string;
  eventType: InteractionEventType;
  eventCategory: InteractionCategory;

  perfumeId?: string;
  houseId?: string;

  eventData?: Record<string, any>;

  deviceType?: string;
  userAgent?: string;
  referrer?: string;
  path: string;

  duration?: number;
  value?: number;
}

export class InteractionTracker {
  /**
   * Track a user interaction event
   */
  static async trackEvent(params: TrackEventParams) {
    try {
      const event = await prisma.userInteractionEvent.create({
        data: {
          userId: params.userId,
          sessionId: params.sessionId,
          eventType: params.eventType,
          eventCategory: params.eventCategory,
          timestamp: new Date(),

          perfumeId: params.perfumeId,
          houseId: params.houseId,

          eventData: params.eventData || {},

          deviceType: params.deviceType,
          userAgent: params.userAgent,
          referrer: params.referrer,
          path: params.path,

          duration: params.duration,
          value: params.value,
        },
      });

      // Update session metrics asynchronously
      this.updateSessionMetrics(params.sessionId).catch(console.error);

      // Update perfume stats if applicable
      if (params.perfumeId) {
        this.updatePerfumeStats(params.perfumeId, params.eventType).catch(
          console.error
        );
      }

      return event;
    } catch (error) {
      console.error("Failed to track event:", error);
      // Don't throw - tracking errors shouldn't break user experience
      return null;
    }
  }

  /**
   * Batch track multiple events
   */
  static async trackBatch(events: TrackEventParams[]) {
    try {
      const result = await prisma.userInteractionEvent.createMany({
        data: events.map((params) => ({
          userId: params.userId,
          sessionId: params.sessionId,
          eventType: params.eventType,
          eventCategory: params.eventCategory,
          timestamp: new Date(),
          perfumeId: params.perfumeId,
          houseId: params.houseId,
          eventData: params.eventData || {},
          deviceType: params.deviceType,
          userAgent: params.userAgent,
          referrer: params.referrer,
          path: params.path,
          duration: params.duration,
          value: params.value,
        })),
        skipDuplicates: true,
      });

      return result;
    } catch (error) {
      console.error("Failed to batch track events:", error);
      return null;
    }
  }

  /**
   * Update session metrics
   */
  private static async updateSessionMetrics(sessionId: string) {
    const events = await prisma.userInteractionEvent.findMany({
      where: { sessionId },
      orderBy: { timestamp: "asc" },
    });

    if (events.length === 0) return;

    const pageViews = events.filter((e) => e.eventCategory === "VIEW").length;
    const perfumesViewed = new Set(
      events.filter((e) => e.perfumeId).map((e) => e.perfumeId)
    ).size;
    const interactions = events.filter((e) =>
      ["RATING", "REVIEW", "COLLECTION", "WISHLIST"].includes(e.eventCategory)
    ).length;

    const startTime = events[0].timestamp;
    const endTime = events[events.length - 1].timestamp;
    const duration = Math.floor(
      (endTime.getTime() - startTime.getTime()) / 1000
    );

    await prisma.userSession.upsert({
      where: { sessionId },
      update: {
        endTime,
        duration,
        pageViews,
        perfumesViewed,
        interactions,
      },
      create: {
        sessionId,
        userId: events[0].userId,
        startTime,
        endTime,
        duration,
        deviceType: events[0].deviceType || "unknown",
        browser: this.parseBrowser(events[0].userAgent),
        os: this.parseOS(events[0].userAgent),
        pageViews,
        perfumesViewed,
        interactions,
      },
    });
  }

  /**
   * Update perfume interaction stats
   */
  private static async updatePerfumeStats(
    perfumeId: string,
    eventType: InteractionEventType
  ) {
    const updates: Record<string, any> = {
      updatedAt: new Date(),
    };

    switch (eventType) {
      case "PERFUME_VIEW":
        updates.totalViews = { increment: 1 };
        updates.lastViewedAt = new Date();
        break;
      case "WISHLIST_ADD":
        updates.inWishlistCount = { increment: 1 };
        break;
      case "WISHLIST_REMOVE":
        updates.inWishlistCount = { decrement: 1 };
        break;
      case "COLLECTION_ADD":
        updates.inCollectionCount = { increment: 1 };
        break;
      case "RATING_COMPLETED":
        updates.totalRatings = { increment: 1 };
        break;
    }

    await prisma.perfumeInteractionStats.upsert({
      where: { perfumeId },
      update: updates,
      create: {
        perfumeId,
        ...Object.fromEntries(
          Object.entries(updates).map(([key, val]) => [
            key,
            typeof val === "object" && val.increment ? 1 : val,
          ])
        ),
      },
    });
  }

  /**
   * Parse browser from user agent
   */
  private static parseBrowser(userAgent?: string): string {
    if (!userAgent) return "unknown";

    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";

    return "other";
  }

  /**
   * Parse OS from user agent
   */
  private static parseOS(userAgent?: string): string {
    if (!userAgent) return "unknown";

    if (userAgent.includes("Windows")) return "Windows";
    if (userAgent.includes("Mac")) return "macOS";
    if (userAgent.includes("Linux")) return "Linux";
    if (userAgent.includes("Android")) return "Android";
    if (userAgent.includes("iOS")) return "iOS";

    return "other";
  }
}

/**
 * Convenience functions for common tracking scenarios
 */
export const trackPerfumeView = (params: {
  userId?: string;
  sessionId: string;
  perfumeId: string;
  duration?: number;
  source?: string;
  userAgent?: string;
  path: string;
}) => {
  return InteractionTracker.trackEvent({
    ...params,
    eventType: "PERFUME_VIEW",
    eventCategory: "VIEW",
    eventData: { source: params.source },
  });
};

export const trackSearch = (params: {
  userId?: string;
  sessionId: string;
  query: string;
  filters: Record<string, any>;
  resultsCount: number;
  userAgent?: string;
  path: string;
}) => {
  return InteractionTracker.trackEvent({
    ...params,
    eventType: "SEARCH_PERFORMED",
    eventCategory: "SEARCH",
    eventData: {
      query: params.query,
      filters: params.filters,
      resultsCount: params.resultsCount,
    },
  });
};

export const trackRating = (params: {
  userId: string;
  sessionId: string;
  perfumeId: string;
  ratings: Record<string, number>;
  timeToComplete?: number;
  userAgent?: string;
  path: string;
}) => {
  return InteractionTracker.trackEvent({
    ...params,
    eventType: "RATING_COMPLETED",
    eventCategory: "RATING",
    eventData: {
      ratings: params.ratings,
      timeToComplete: params.timeToComplete,
    },
    value: params.ratings.overall,
  });
};
```

### Step 3: API Endpoints

Create `app/routes/api/analytics.tsx`:

```typescript
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { InteractionTracker } from "~/models/analytics/interaction-tracking.server";
import { getSessionId } from "~/utils/session.server";
import { getUserId } from "~/utils/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const sessionId = await getSessionId(request);
    const userId = await getUserId(request);
    const userAgent = request.headers.get("user-agent") || undefined;
    const body = await request.json();

    // Single event
    if (body.event) {
      const result = await InteractionTracker.trackEvent({
        userId,
        sessionId,
        userAgent,
        ...body.event,
      });

      return json({ success: true, eventId: result?.id });
    }

    // Batch events
    if (body.events && Array.isArray(body.events)) {
      const result = await InteractionTracker.trackBatch(
        body.events.map((event: any) => ({
          userId,
          sessionId,
          userAgent,
          ...event,
        }))
      );

      return json({ success: true, count: result?.count });
    }

    return json({ error: "Invalid request body" }, { status: 400 });
  } catch (error) {
    console.error("Analytics API error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

## Frontend Implementation

### Step 1: Analytics SDK

Create `app/utils/analytics/analytics-sdk.ts`:

```typescript
import type { InteractionEventType, InteractionCategory } from "@prisma/client";

interface AnalyticsEvent {
  eventType: InteractionEventType;
  eventCategory: InteractionCategory;
  path: string;
  perfumeId?: string;
  houseId?: string;
  eventData?: Record<string, any>;
  duration?: number;
  value?: number;
}

class AnalyticsSDK {
  private queue: AnalyticsEvent[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private maxQueueSize: number = 10;
  private timer: NodeJS.Timeout | null = null;
  private sessionId: string;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.startFlushTimer();

    // Flush on page unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => this.flush());
      window.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          this.flush();
        }
      });
    }
  }

  /**
   * Track an event
   */
  track(event: AnalyticsEvent) {
    this.queue.push(event);

    // Flush if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  /**
   * Flush queued events to server
   */
  async flush() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      // Use sendBeacon for reliability on page unload
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify({ events })], {
          type: "application/json",
        });
        navigator.sendBeacon("/api/analytics", blob);
      } else {
        // Fallback to fetch
        await fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events }),
        });
      }
    } catch (error) {
      console.error("Failed to send analytics events:", error);
      // Re-queue events on error
      this.queue.unshift(...events);
    }
  }

  /**
   * Start automatic flush timer
   */
  private startFlushTimer() {
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Get or create session ID
   */
  private getOrCreateSessionId(): string {
    if (typeof window === "undefined") return "server";

    let sessionId = sessionStorage.getItem("analyticsSessionId");

    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      sessionStorage.setItem("analyticsSessionId", sessionId);
    }

    return sessionId;
  }
}

// Singleton instance
export const analytics = new AnalyticsSDK();

/**
 * Convenience tracking functions
 */
export const trackPageView = (path: string, perfumeId?: string) => {
  analytics.track({
    eventType: "PAGE_VIEW",
    eventCategory: "VIEW",
    path,
    perfumeId,
  });
};

export const trackPerfumeView = (
  perfumeId: string,
  path: string,
  source?: string
) => {
  analytics.track({
    eventType: "PERFUME_VIEW",
    eventCategory: "VIEW",
    path,
    perfumeId,
    eventData: { source },
  });
};

export const trackSearch = (
  query: string,
  filters: Record<string, any>,
  resultsCount: number,
  path: string
) => {
  analytics.track({
    eventType: "SEARCH_PERFORMED",
    eventCategory: "SEARCH",
    path,
    eventData: { query, filters, resultsCount },
  });
};

export const trackWishlistAdd = (
  perfumeId: string,
  path: string,
  source?: string
) => {
  analytics.track({
    eventType: "WISHLIST_ADD",
    eventCategory: "WISHLIST",
    path,
    perfumeId,
    eventData: { source },
  });
};

export const trackCollectionAdd = (perfumeId: string, path: string) => {
  analytics.track({
    eventType: "COLLECTION_ADD",
    eventCategory: "COLLECTION",
    path,
    perfumeId,
  });
};
```

### Step 2: React Hooks

Create `app/hooks/useAnalytics.ts`:

```typescript
import { useEffect, useRef } from 'react'
import { useLocation } from '@remix-run/react'
import { trackPageView, trackPerfumeView } from '~/utils/analytics/analytics-sdk'

/**
 * Hook to track page views automatically
 */
export function usePageTracking() {
  const location = useLocation()
  const previousPath = useRef<string>()

  useEffect(() {
    if (previousPath.current !== location.pathname) {
      trackPageView(location.pathname)
      previousPath.current = location.pathname
    }
  }, [location.pathname])
}

/**
 * Hook to track perfume view with duration
 */
export function usePerfumeViewTracking(perfumeId: string, source?: string) {
  const location = useLocation()
  const startTime = useRef(Date.now())

  useEffect(() => {
    // Track view on mount
    trackPerfumeView(perfumeId, location.pathname, source)

    // Track duration on unmount
    return () => {
      const duration = Date.now() - startTime.current
      trackPerfumeView(perfumeId, location.pathname, source)
    }
  }, [perfumeId, location.pathname, source])
}

/**
 * Hook to track time on element
 */
export function useTimeTracking(callback: (duration: number) => void) {
  const startTime = useRef(Date.now())

  useEffect(() => {
    return () => {
      const duration = Date.now() - startTime.current
      callback(duration)
    }
  }, [callback])
}
```

### Step 3: Integrate Tracking

Update `app/root.tsx`:

```typescript
import { usePageTracking } from "~/hooks/useAnalytics";

export default function App() {
  // Track all page views
  usePageTracking();

  return (
    <Document>
      <Outlet />
    </Document>
  );
}
```

Update `app/routes/perfume.tsx`:

```typescript
import { usePerfumeViewTracking } from '~/hooks/useAnalytics'
import { trackWishlistAdd, trackCollectionAdd } from '~/utils/analytics/analytics-sdk'

export default function PerfumeDetail() {
  const { perfume } = useLoaderData<typeof loader>()

  // Track perfume view
  usePerfumeViewTracking(perfume.id, 'detail_page')

  const handleWishlistAdd = async () => {
    // ... existing logic
    trackWishlistAdd(perfume.id, window.location.pathname, 'detail_page')
  }

  const handleCollectionAdd = async () => {
    // ... existing logic
    trackCollectionAdd(perfume.id, window.location.pathname)
  }

  return (
    // ... component JSX
  )
}
```

---

## Data Pipeline

### Aggregation Jobs

Create `scripts/analytics/aggregate-daily.ts`:

```typescript
import { prisma } from "../app/db.server";

async function aggregateDailyStats() {
  console.log("Starting daily aggregation...");

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Update user behavior profiles
  await updateUserBehaviorProfiles(yesterday, today);

  // Update perfume statistics
  await updatePerfumeStatistics(yesterday, today);

  // Calculate trending scores
  await calculateTrendingScores();

  console.log("Daily aggregation completed");
}

async function updateUserBehaviorProfiles(startDate: Date, endDate: Date) {
  // Get all active users from yesterday
  const activeUsers = await prisma.userInteractionEvent.findMany({
    where: {
      timestamp: { gte: startDate, lt: endDate },
      userId: { not: null },
    },
    select: { userId: true },
    distinct: ["userId"],
  });

  for (const { userId } of activeUsers) {
    if (!userId) continue;

    // Aggregate user's last 30 days of activity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const events = await prisma.userInteractionEvent.findMany({
      where: {
        userId,
        timestamp: { gte: thirtyDaysAgo },
      },
    });

    // Calculate metrics
    const totalPageViews = events.filter(
      (e) => e.eventCategory === "VIEW"
    ).length;
    const totalSearches = events.filter(
      (e) => e.eventCategory === "SEARCH"
    ).length;
    const totalPerfumesViewed = new Set(
      events.filter((e) => e.perfumeId).map((e) => e.perfumeId)
    ).size;

    // Get ratings
    const ratings = await prisma.userPerfumeRating.findMany({
      where: { userId },
    });

    // Get collection/wishlist
    const collection = await prisma.userPerfume.count({ where: { userId } });
    const wishlist = await prisma.userPerfumeWishlist.count({
      where: { userId },
    });

    // Update profile
    await prisma.userBehaviorProfile.upsert({
      where: { userId },
      update: {
        totalPageViews,
        totalSearches,
        totalPerfumesViewed,
        totalRatings: ratings.length,
        avgRatingValue:
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + (r.overall || 0), 0) /
              ratings.length
            : null,
        collectionSize: collection,
        wishlistSize: wishlist,
        lastActiveDate: new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId,
        preferredNotes: {},
        preferredHouses: {},
        preferredPriceRange: {},
        totalPageViews,
        totalSearches,
        totalPerfumesViewed,
        totalRatings: ratings.length,
        avgRatingValue:
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + (r.overall || 0), 0) /
              ratings.length
            : null,
        collectionSize: collection,
        wishlistSize: wishlist,
        engagementScore: 0,
        lastActiveDate: new Date(),
      },
    });
  }
}

async function updatePerfumeStatistics(startDate: Date, endDate: Date) {
  // Similar logic for perfume stats
  // ...
}

async function calculateTrendingScores() {
  // Calculate trending scores based on view velocity
  // ...
}

// Run if called directly
if (require.main === module) {
  aggregateDailyStats()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
```

Add to `package.json`:

```json
{
  "scripts": {
    "analytics:aggregate": "tsx scripts/analytics/aggregate-daily.ts"
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// app/models/analytics/__tests__/interaction-tracking.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { InteractionTracker } from "../interaction-tracking.server";
import { prisma } from "~/db.server";

describe("InteractionTracker", () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.userInteractionEvent.deleteMany();
  });

  it("tracks page view event", async () => {
    const event = await InteractionTracker.trackEvent({
      sessionId: "test-session",
      eventType: "PAGE_VIEW",
      eventCategory: "VIEW",
      path: "/perfume/test",
    });

    expect(event).toBeTruthy();
    expect(event?.eventType).toBe("PAGE_VIEW");
  });

  it("tracks perfume view with metadata", async () => {
    const event = await InteractionTracker.trackEvent({
      sessionId: "test-session",
      eventType: "PERFUME_VIEW",
      eventCategory: "VIEW",
      path: "/perfume/test",
      perfumeId: "perfume-123",
      eventData: { source: "search" },
      duration: 5000,
    });

    expect(event?.perfumeId).toBe("perfume-123");
    expect(event?.duration).toBe(5000);
  });

  it("handles tracking errors gracefully", async () => {
    const event = await InteractionTracker.trackEvent({
      sessionId: "test-session",
      eventType: "PAGE_VIEW" as any,
      eventCategory: "INVALID" as any,
      path: "/test",
    });

    expect(event).toBeNull();
  });
});
```

### Integration Tests

```typescript
// test/integration/analytics.test.ts
import { test, expect } from "@playwright/test";

test.describe("Analytics Integration", () => {
  test("tracks page view on navigation", async ({ page }) => {
    await page.goto("/perfume/test-perfume");

    // Wait for analytics to be sent
    await page.waitForTimeout(1000);

    // Verify event was tracked
    // (Would need to check database or mock API)
  });

  test("tracks wishlist add", async ({ page }) => {
    await page.goto("/perfume/test-perfume");
    await page.click('[data-testid="wishlist-add"]');

    // Wait for analytics
    await page.waitForTimeout(1000);

    // Verify tracking
  });
});
```

---

## Deployment

### Environment Variables

Add to `.env`:

```bash
# Analytics
ENABLE_ANALYTICS=true
ANALYTICS_BATCH_SIZE=10
ANALYTICS_FLUSH_INTERVAL=5000
```

### Cron Jobs

Set up cron jobs for aggregation:

```bash
# Daily aggregation at 2 AM
0 2 * * * cd /app && npm run analytics:aggregate

# Weekly reports on Sundays at midnight
0 0 * * 0 cd /app && npm run analytics:weekly-report
```

### Monitoring

Set up alerts for:

- Failed event tracking (error rate > 5%)
- Analytics API latency (> 500ms)
- Database query performance
- Storage growth rate

---

## Next Steps

1. [ ] Implement database migrations
2. [ ] Create backend tracking service
3. [ ] Build frontend SDK
4. [ ] Add tracking to key pages
5. [ ] Set up aggregation jobs
6. [ ] Create monitoring dashboard
7. [ ] Test thoroughly
8. [ ] Deploy to staging
9. [ ] Monitor and iterate

---

**Document Status:** Implementation Guide v1.0  
**Related Documents:**

- [Data Collection Strategy](./01_USER_INTERACTION_DATA_COLLECTION_STRATEGY.md)
- [Data Model](./02_USER_INTERACTION_DATA_MODEL.md)
