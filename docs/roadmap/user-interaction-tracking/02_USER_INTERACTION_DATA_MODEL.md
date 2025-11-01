# User Interaction Data Model

## Overview

This document defines the comprehensive data model for capturing, storing, and analyzing user interactions within the New Smell platform for AI/ML applications.

**Status:** Design Phase  
**Version:** 1.0  
**Last Updated:** 2025-11-01

---

## Table of Contents

1. [Database Schema Design](#database-schema-design)
2. [Event Types & Structure](#event-types--structure)
3. [User Behavior Profile](#user-behavior-profile)
4. [Feature Engineering](#feature-engineering)
5. [Data Aggregation](#data-aggregation)
6. [Storage Strategy](#storage-strategy)

---

## Database Schema Design

### Core Analytics Tables

#### 1. UserInteractionEvent

Primary event tracking table for all user interactions.

```prisma
model UserInteractionEvent {
  id            String   @id @default(cuid())
  userId        String?  // Nullable for anonymous users
  sessionId     String
  eventType     InteractionEventType
  eventCategory InteractionCategory
  timestamp     DateTime @default(now())

  // Resource identifiers
  perfumeId     String?
  houseId       String?
  noteId        String?

  // Event-specific data (JSON)
  eventData     Json

  // Context
  deviceType    String?
  userAgent     String?
  referrer      String?
  path          String

  // Metrics
  duration      Int?     // Duration in milliseconds
  value         Float?   // Numeric value (rating, price, etc.)

  // Relationships
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
  // View Events
  PAGE_VIEW
  PERFUME_VIEW
  HOUSE_VIEW
  COLLECTION_VIEW

  // Search Events
  SEARCH_PERFORMED
  SEARCH_RESULT_CLICKED
  SEARCH_REFINED
  SEARCH_NO_RESULTS

  // Filter Events
  FILTER_APPLIED
  FILTER_REMOVED
  FILTER_CLEARED

  // Interaction Events
  RATING_STARTED
  RATING_COMPLETED
  RATING_UPDATED
  REVIEW_STARTED
  REVIEW_SUBMITTED
  REVIEW_UPDATED

  // Collection Events
  WISHLIST_ADD
  WISHLIST_REMOVE
  COLLECTION_ADD
  COLLECTION_UPDATE
  COLLECTION_REMOVE

  // Engagement Events
  IMAGE_VIEWED
  IMAGE_ZOOMED
  NOTES_EXPANDED
  NOTES_COLLAPSED
  SIMILAR_CLICKED
  HOUSE_LINK_CLICKED

  // Social Events
  PROFILE_VIEWED
  COLLECTION_SHARED
  TRADE_INQUIRY

  // Navigation Events
  NAVIGATION_CLICK
  BACK_BUTTON
  EXTERNAL_LINK

  // Conversion Events
  TRADE_OFFERED
  TRADE_ACCEPTED
  TRADE_DECLINED
  PURCHASE_INITIATED
  PURCHASE_COMPLETED
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
  SOCIAL
  NAVIGATION
  CONVERSION
}
```

#### 2. UserSession

Session-level aggregation for analytics.

```prisma
model UserSession {
  id              String   @id @default(cuid())
  sessionId       String   @unique
  userId          String?

  // Session metadata
  startTime       DateTime @default(now())
  endTime         DateTime?
  duration        Int?     // Duration in seconds

  // Session context
  deviceType      String
  browser         String
  os              String
  location        String?
  referrer        String?

  // Session metrics
  pageViews       Int      @default(0)
  perfumesViewed  Int      @default(0)
  interactions    Int      @default(0)

  // Conversion flags
  addedToWishlist Boolean  @default(false)
  addedToCollection Boolean @default(false)
  completedRating Boolean  @default(false)
  completedReview Boolean  @default(false)

  // Exit information
  exitPage        String?
  bounced         Boolean  @default(false)

  user            User?    @relation(fields: [userId], references: [id])

  @@index([userId, startTime])
  @@index([startTime])
}
```

#### 3. UserBehaviorProfile

Aggregated user behavior profile for ML features.

```prisma
model UserBehaviorProfile {
  id                      String   @id @default(cuid())
  userId                  String   @unique

  // Preference indicators
  preferredNotes          Json     // Array of note IDs with weights
  preferredHouses         Json     // Array of house IDs with weights
  preferredPriceRange     Json     // { min, max, average }
  preferredPerfumeTypes   Json     // Array of perfume types with counts

  // Engagement metrics
  totalSessions           Int      @default(0)
  totalPageViews          Int      @default(0)
  totalPerfumesViewed     Int      @default(0)
  totalSearches           Int      @default(0)
  avgSessionDuration      Float    @default(0)

  // Interaction metrics
  totalRatings            Int      @default(0)
  avgRatingValue          Float?
  totalReviews            Int      @default(0)
  avgReviewLength         Float?

  // Collection metrics
  collectionSize          Int      @default(0)
  wishlistSize            Int      @default(0)
  tradingActivity         Int      @default(0)

  // Behavior patterns
  activeTimeOfDay         Json     // Hour distribution
  activeDaysOfWeek        Json     // Day distribution
  searchPatterns          Json     // Common search terms
  browsingStyle           String?  // 'explorer', 'focused', 'trader'

  // Engagement level
  engagementScore         Float    @default(0)
  lastActiveDate          DateTime @default(now())

  // ML features (pre-computed)
  featureVector           Json?    // Vector representation for ML

  // Metadata
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt

  user                    User     @relation(fields: [userId], references: [id])

  @@index([engagementScore])
  @@index([lastActiveDate])
}
```

#### 4. PerfumeInteractionStats

Aggregated perfume-level interaction statistics.

```prisma
model PerfumeInteractionStats {
  id                    String   @id @default(cuid())
  perfumeId             String   @unique

  // View metrics
  totalViews            Int      @default(0)
  uniqueViewers         Int      @default(0)
  avgViewDuration       Float    @default(0)

  // Engagement metrics
  totalRatings          Int      @default(0)
  avgRating             Float?
  totalReviews          Int      @default(0)
  totalComments         Int      @default(0)

  // Collection metrics
  inWishlistCount       Int      @default(0)
  inCollectionCount     Int      @default(0)

  // Search metrics
  searchImpressions     Int      @default(0)
  searchClicks          Int      @default(0)
  searchCTR             Float?   // Click-through rate

  // Recommendation metrics
  recommendationImprs   Int      @default(0)
  recommendationClicks  Int      @default(0)
  recommendationCTR     Float?

  // Conversion metrics
  tradeInquiries        Int      @default(0)
  tradeCompleted        Int      @default(0)

  // Trend metrics
  viewsLast7Days        Int      @default(0)
  viewsLast30Days       Int      @default(0)
  trendingScore         Float    @default(0)

  // Metadata
  lastViewedAt          DateTime?
  updatedAt             DateTime @updatedAt

  perfume               Perfume  @relation(fields: [perfumeId], references: [id])

  @@index([trendingScore])
  @@index([totalViews])
  @@index([inWishlistCount])
}
```

#### 5. SearchQuery

Detailed search query tracking for search optimization.

```prisma
model SearchQuery {
  id              String   @id @default(cuid())
  sessionId       String
  userId          String?

  // Query details
  queryText       String
  queryType       String   // 'text', 'voice', 'filter_only'

  // Filters applied
  filters         Json

  // Results
  resultsCount    Int
  resultsShown    Int

  // User actions
  clickedPositions Json   // Array of clicked result positions
  clickedPerfumes  Json   // Array of perfume IDs clicked

  // Time metrics
  timeToFirstClick Int?   // Milliseconds
  timeOnResults    Int?   // Milliseconds

  // Outcome
  foundDesired    Boolean @default(false)
  refinedQuery    Boolean @default(false)
  abandoned       Boolean @default(false)

  timestamp       DateTime @default(now())

  user            User?    @relation(fields: [userId], references: [id])

  @@index([userId, timestamp])
  @@index([queryText])
  @@index([timestamp])
}
```

#### 6. RecommendationFeedback

Track recommendation performance for ML training.

```prisma
model RecommendationFeedback {
  id                   String   @id @default(cuid())
  userId               String
  perfumeId            String
  recommendationId     String   // Unique ID for the recommendation instance

  // Recommendation context
  source               String   // 'homepage', 'detail_page', 'search', 'email'
  algorithm            String   // Which algorithm generated this
  position             Int      // Position in recommendation list

  // User response
  viewed               Boolean  @default(false)
  clicked              Boolean  @default(false)
  addedToWishlist      Boolean  @default(false)
  addedToCollection    Boolean  @default(false)
  rated                Boolean  @default(false)

  // Explicit feedback
  thumbsUp             Boolean?
  thumbsDown           Boolean?
  hidPerfume           Boolean  @default(false)
  reportedIrrelevant   Boolean  @default(false)

  // Timing
  impressionTime       DateTime @default(now())
  firstInteractionTime DateTime?

  // Metadata
  confidence           Float?   // Algorithm confidence score
  similarityScore      Float?   // Similarity to user preferences

  user                 User     @relation(fields: [userId], references: [id])
  perfume              Perfume  @relation(fields: [perfumeId], references: [id])

  @@unique([recommendationId, userId, perfumeId])
  @@index([userId, impressionTime])
  @@index([algorithm, clicked])
}
```

---

## Event Types & Structure

### Detailed Event Schemas

#### Page View Events

```typescript
interface PageViewEvent {
  eventType: "PAGE_VIEW" | "PERFUME_VIEW" | "HOUSE_VIEW"
  timestamp: Date

  // Page context
  path: string
  title: string

  // Resource IDs
  perfumeId?: string
  houseId?: string

  // Metrics
  viewDuration: number // milliseconds
  scrollDepth: number // percentage (0-100)
  timeToInteraction: number // milliseconds to first interaction

  // Context
  source: "direct" | "search" | "recommendation" | "social" | "external"
  referrer?: string

  // Device info
  viewport: { width: number; height: number }
  deviceType: "mobile" | "tablet" | "desktop"
}
```

#### Search Events

```typescript
interface SearchEvent {
  eventType: "SEARCH_PERFORMED"
  timestamp: Date

  // Query details
  query: string
  queryLength: number
  queryWords: string[]

  // Filters
  filters: {
    houses?: string[]
    notes?: string[]
    priceRange?: { min: number; max: number }
    perfumeType?: string[]
    availability?: boolean
    tradeable?: boolean
  }

  // Results
  resultsCount: number
  resultsShown: number
  hasResults: boolean

  // Context
  searchType: "initial" | "refinement" | "suggestion_click"
  previousQuery?: string
  suggestionUsed?: boolean
}
```

#### Rating Events

```typescript
interface RatingEvent {
  eventType: "RATING_COMPLETED"
  timestamp: Date

  perfumeId: string

  // Rating values
  ratings: {
    overall?: number // 1-5
    longevity?: number // 1-5
    sillage?: number // 1-5
    priceValue?: number // 1-5
    gender?: number // 1-5
  }

  // Interaction metrics
  timeToComplete: number // seconds
  categoriesRated: number
  edited: boolean
  previousRatings?: object

  // Context
  source: "detail_page" | "collection" | "prompt"
  hadPreviousRating: boolean
}
```

#### Collection Events

```typescript
interface CollectionEvent {
  eventType: "COLLECTION_ADD" | "COLLECTION_UPDATE" | "COLLECTION_REMOVE"
  timestamp: Date

  perfumeId: string

  // Collection details
  amount?: string
  available?: string
  price?: string
  tradePreference?: "cash" | "trade" | "both"

  // Context
  source: "detail_page" | "wishlist_convert" | "import"
  timeInWishlist?: number // If converted from wishlist

  // For updates
  changedFields?: string[]
  previousValues?: object
}
```

#### Engagement Events

```typescript
interface EngagementEvent {
  eventType: "IMAGE_VIEWED" | "NOTES_EXPANDED" | "SIMILAR_CLICKED"
  timestamp: Date

  perfumeId: string

  // Event-specific data
  eventData: {
    // For IMAGE_VIEWED
    imageIndex?: number
    viewDuration?: number
    zoomed?: boolean

    // For NOTES_EXPANDED
    noteType?: "open" | "heart" | "base"
    expandDuration?: number

    // For SIMILAR_CLICKED
    targetPerfumeId?: string
    position?: number
    similarityReason?: string
  }

  // Context
  pageScrollPosition: number
  timeOnPage: number
}
```

---

## User Behavior Profile

### Profile Calculation Logic

```typescript
interface UserBehaviorCalculations {
  // Preference weights (0-1 normalized scores)
  calculateNotePreferences(): Record<string, number>
  calculateHousePreferences(): Record<string, number>
  calculatePriceRange(): { min: number; max: number; avg: number }

  // Engagement metrics
  calculateEngagementScore(): number // 0-100
  calculateBrowsingStyle(): "explorer" | "focused" | "trader" | "casual"
  calculateChurnRisk(): number // 0-1 probability

  // Temporal patterns
  calculateActiveHours(): number[] // Hour distribution (24 elements)
  calculateActiveDays(): number[] // Day distribution (7 elements)
  calculateSessionPatterns(): SessionPattern[]

  // Recommendation features
  generateFeatureVector(): number[] // For ML models
  calculateUserSimilarity(otherUserId: string): number // 0-1 similarity
}
```

### Feature Vector Structure

```typescript
interface UserFeatureVector {
  // Demographic (if available)
  accountAge: number // days since signup

  // Engagement features (20 features)
  totalSessions: number
  avgSessionDuration: number
  totalPageViews: number
  perfumeViewRate: number // perfumes viewed per session
  searchRate: number // searches per session
  interactionRate: number // interactions per page view

  // Collection features (15 features)
  collectionSize: number
  wishlistSize: number
  ratingsCount: number
  reviewsCount: number
  avgRatingValue: number
  collectionGrowthRate: number // items added per week

  // Preference features (50 features)
  topNotePreferences: number[] // Top 25 notes, weight 0-1
  topHousePreferences: number[] // Top 15 houses, weight 0-1
  pricePointIndex: number // 0-1, where they shop price-wise
  perfumeTypeMix: number[] // Distribution across types

  // Behavioral features (15 features)
  explorationScore: number // How much they explore vs. focused
  tradingActivity: number // Trading frequency
  socialActivity: number // Interaction with other users
  contentCreation: number // Reviews, comments written
  responseTime: number // Avg time to interact after viewing

  // Temporal features (10 features)
  dayOfWeekActivity: number[] // Activity distribution (7)
  hourOfDayActivity: number[] // Peak hours encoded (3)

  // Total: ~110 features
}
```

---

## Feature Engineering

### Feature Categories for ML

#### 1. User-Level Features

```typescript
interface UserFeatures {
  // Identity
  userId: string
  accountAge: number

  // Explicit preferences
  ratingHistory: RatingFeature[]
  reviewSentiment: number[]
  wishlistComposition: string[]
  collectionComposition: string[]

  // Implicit preferences
  viewHistory: ViewFeature[]
  searchHistory: SearchFeature[]
  browsingPatterns: BrowsingPattern[]

  // Engagement
  sessionMetrics: SessionMetrics
  interactionDepth: number
  contentContribution: number

  // Social
  profileViews: number
  collectionViews: number
  tradingReputation: number
}
```

#### 2. Perfume-Level Features

```typescript
interface PerfumeFeatures {
  // Identity
  perfumeId: string
  houseId: string

  // Attributes
  notes: string[] // Note IDs
  noteCategories: string[] // Floral, woody, etc.
  perfumeType: string
  concentration: string

  // Popularity
  viewCount: number
  uniqueViewers: number
  wishlistCount: number
  collectionCount: number

  // Quality signals
  avgRating: number
  ratingCount: number
  reviewCount: number
  reviewSentiment: number

  // Market signals
  avgPrice: number
  tradeVolume: number
  searchVolume: number

  // Trends
  viewGrowth: number
  wishlistGrowth: number
  trendingScore: number
}
```

#### 3. Interaction Features

```typescript
interface InteractionFeatures {
  // User-Perfume interaction
  userId: string
  perfumeId: string

  // Explicit interactions
  hasRated: boolean
  ratingValue?: number
  hasReviewed: boolean
  reviewSentiment?: number
  inWishlist: boolean
  inCollection: boolean

  // Implicit interactions
  viewCount: number
  totalViewDuration: number
  lastViewedAt: Date
  viewRecency: number // days since last view

  // Context
  viewSources: string[] // How they found it
  deviceTypes: string[] // What devices used

  // Temporal
  firstInteraction: Date
  lastInteraction: Date
  interactionFrequency: number
}
```

---

## Data Aggregation

### Aggregation Schedules

```typescript
interface AggregationJobs {
  // Real-time (as events occur)
  realtimeAggregations: {
    perfumeViewCount: "immediate"
    sessionMetrics: "immediate"
    wishlistCount: "immediate"
  }

  // Hourly
  hourlyAggregations: {
    trendingPerfumes: "every hour"
    searchPopularity: "every hour"
    activeUsers: "every hour"
  }

  // Daily
  dailyAggregations: {
    userBehaviorProfiles: "daily at 2am"
    perfumeStatistics: "daily at 3am"
    recommendationMetrics: "daily at 4am"
  }

  // Weekly
  weeklyAggregations: {
    trendAnalysis: "Sunday at midnight"
    userSegmentation: "Sunday at 1am"
    performanceReports: "Sunday at 2am"
  }
}
```

### Aggregation Queries

```typescript
// Example: Daily user behavior profile update
async function updateUserBehaviorProfile(userId: string) {
  const last30Days = new Date()
  last30Days.setDate(last30Days.getDate() - 30)

  // Aggregate events
  const events = await prisma.userInteractionEvent.findMany({
    where: {
      userId,
      timestamp: { gte: last30Days },
    },
  })

  // Calculate metrics
  const profile = {
    totalPageViews: events.filter((e) => e.eventCategory === "VIEW").length,
    totalSearches: events.filter((e) => e.eventCategory === "SEARCH").length,
    totalInteractions: events.filter((e) =>
      ["RATING", "REVIEW", "COLLECTION"].includes(e.eventCategory)
    ).length,

    // Note preferences (weighted by interaction type)
    preferredNotes: calculateNotePreferences(events),

    // House preferences
    preferredHouses: calculateHousePreferences(events),

    // Engagement score
    engagementScore: calculateEngagementScore(events),

    // Update timestamp
    updatedAt: new Date(),
  }

  // Update profile
  await prisma.userBehaviorProfile.upsert({
    where: { userId },
    update: profile,
    create: { userId, ...profile },
  })
}
```

---

## Storage Strategy

### Hot/Warm/Cold Data Architecture

```typescript
interface DataStorageStrategy {
  // Hot Data (Fast access, expensive storage)
  // Last 7 days, frequently accessed
  hotStorage: {
    location: "Primary Database"
    retention: "7 days"
    tables: ["UserInteractionEvent", "UserSession", "SearchQuery"]
    indexing: "Full indexing"
  }

  // Warm Data (Moderate access, moderate cost)
  // 7-90 days, occasionally accessed
  warmStorage: {
    location: "Primary Database"
    retention: "90 days"
    tables: ["UserInteractionEvent", "SearchQuery", "RecommendationFeedback"]
    indexing: "Selective indexing"
  }

  // Cold Data (Rare access, cheap storage)
  // 90+ days, archival purposes
  coldStorage: {
    location: "Data Warehouse / S3"
    retention: "2 years"
    format: "Parquet / Compressed JSON"
    access: "Via batch jobs only"
  }
}
```

### Data Retention Policy

```typescript
interface DataRetentionPolicy {
  // Event data
  rawEvents: {
    retention: "90 days in hot storage"
    archival: "2 years in cold storage"
    deletion: "After 2 years or user request"
  }

  // Aggregated data
  aggregatedProfiles: {
    retention: "Indefinite while user active"
    anonymization: "After 180 days inactive"
    deletion: "After 2 years inactive or user request"
  }

  // ML training data
  trainingDatasets: {
    retention: "Until model superseded + 90 days"
    anonymization: "Always anonymized"
    versioning: "Keep last 3 versions"
  }

  // Analytics reports
  reports: {
    retention: "1 year"
    aggregationLevel: "User-level data aggregated to cohorts"
  }
}
```

### Data Partitioning

```sql
-- Partition UserInteractionEvent by month
CREATE TABLE UserInteractionEvent (
  ...
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions
CREATE TABLE UserInteractionEvent_2025_01
  PARTITION OF UserInteractionEvent
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE UserInteractionEvent_2025_02
  PARTITION OF UserInteractionEvent
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Auto-create future partitions via cron job
```

---

## Performance Considerations

### Indexing Strategy

```sql
-- High-frequency queries
CREATE INDEX idx_user_events_recent ON UserInteractionEvent(userId, timestamp DESC)
  WHERE timestamp > NOW() - INTERVAL '7 days';

CREATE INDEX idx_perfume_events ON UserInteractionEvent(perfumeId, eventType, timestamp);

CREATE INDEX idx_session_events ON UserInteractionEvent(sessionId, timestamp);

-- Search optimization
CREATE INDEX idx_search_query_text ON SearchQuery USING gin(to_tsvector('english', queryText));

-- Analytics queries
CREATE INDEX idx_event_category_time ON UserInteractionEvent(eventCategory, timestamp);
```

### Query Optimization

```typescript
// Use aggregated tables for common queries
// Instead of scanning all events:
const trendingPerfumes = await prisma.userInteractionEvent.groupBy({
  by: ["perfumeId"],
  where: {
    eventType: "PERFUME_VIEW",
    timestamp: { gte: last7Days },
  },
  _count: { perfumeId: true },
  orderBy: { _count: { perfumeId: "desc" } },
  take: 10,
})

// Use pre-aggregated stats:
const trendingPerfumes = await prisma.perfumeInteractionStats.findMany({
  orderBy: { viewsLast7Days: "desc" },
  take: 10,
})
```

---

## Next Steps

1. [ ] Review and approve data model
2. [ ] Create Prisma migrations
3. [ ] Implement aggregation jobs
4. [ ] Set up data retention policies
5. [ ] Create monitoring dashboards
6. [ ] Begin collecting interaction data

---

**Document Status:** Design Draft v1.0  
**Related Documents:**

- [User Interaction Data Collection Strategy](./01_USER_INTERACTION_DATA_COLLECTION_STRATEGY.md)
- [Implementation Guide](./03_INTERACTION_TRACKING_IMPLEMENTATION.md) _(next)_
