# User Interaction Data Collection Strategy

## Executive Summary

This document outlines a comprehensive strategy for collecting and structuring user interaction data to power AI-driven features in the New Smell perfume trading platform, particularly the Intelligent Perfume Recommendation Engine.

**Status:** Planning Phase  
**Priority:** CRITICAL  
**Target Completion:** Phase 1 - Week 2

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Data Collection Objectives](#data-collection-objectives)
3. [User Interaction Categories](#user-interaction-categories)
4. [Data Collection Points](#data-collection-points)
5. [Privacy & Compliance](#privacy--compliance)
6. [Implementation Roadmap](#implementation-roadmap)

---

## Current State Analysis

### Existing Data Sources

The platform already captures several types of user interactions:

#### 1. **Collection Data** (`UserPerfume`)

- **What:** User-owned perfumes
- **Captured:** Amount, availability, pricing, purchase location, trade preferences
- **Usage:** Trading, inventory management
- **AI Potential:** HIGH - Shows actual ownership and engagement

#### 2. **Rating Data** (`UserPerfumeRating`)

- **What:** Multi-dimensional perfume ratings
- **Captured:** Longevity, sillage, gender appeal, overall, price-value
- **Usage:** Quality assessment, community feedback
- **AI Potential:** VERY HIGH - Direct preference signals

#### 3. **Wishlist Data** (`UserPerfumeWishlist`)

- **What:** Desired perfumes
- **Captured:** Perfume ID, timestamp, visibility
- **Usage:** Intent tracking, demand analysis
- **AI Potential:** VERY HIGH - Strong interest indicator

#### 4. **Review Data** (`UserPerfumeReview`)

- **What:** Text-based perfume reviews
- **Captured:** Review text, approval status, timestamps
- **Usage:** Community insights, quality feedback
- **AI Potential:** HIGH - Sentiment and preference analysis

#### 5. **Comment Data** (`UserPerfumeComment`)

- **What:** Comments on specific perfume listings
- **Captured:** Comment text, visibility, timestamps
- **Usage:** Communication, feedback
- **AI Potential:** MEDIUM - Context-specific interactions

#### 6. **Security & Audit Data**

- **What:** Login events, access patterns, security violations
- **Captured:** Comprehensive audit trail
- **Usage:** Security monitoring
- **AI Potential:** LOW - Primarily for security, not recommendations

#### 7. **Performance Data**

- **What:** Web vitals, page load metrics
- **Captured:** LCP, FID, CLS, FCP, TTI
- **Usage:** Performance optimization
- **AI Potential:** LOW - UX optimization, not personalization

### What's Missing

Critical interaction data NOT currently captured:

1. **Page Views & Navigation**

   - Perfume detail page views
   - Browse patterns
   - Search queries
   - Filter usage
   - Navigation paths

2. **Engagement Metrics**

   - Time spent on perfume pages
   - Scroll depth
   - Image interactions
   - Note expansion/viewing
   - House page visits

3. **Search Behavior**

   - Search queries (raw text)
   - Search filters applied
   - Results clicked
   - Zero-result searches
   - Query refinements

4. **Social Interactions**

   - Profile views
   - Collection views
   - Following/followers
   - Trade inquiries
   - Message exchanges

5. **Temporal Patterns**

   - Session duration
   - Time between interactions
   - Day/time preferences
   - Seasonal engagement

6. **Abandonment Signals**
   - Cart/wishlist abandonment
   - Incomplete ratings
   - Started but not submitted reviews
   - Page exits

---

## Data Collection Objectives

### Primary Objectives

1. **Enable Personalized Recommendations**

   - Understand user preferences at a granular level
   - Identify similar users for collaborative filtering
   - Track preference evolution over time

2. **Improve Search & Discovery**

   - Understand search intent
   - Optimize result relevance
   - Suggest better alternatives

3. **Predict User Behavior**

   - Anticipate needs and interests
   - Identify churn risk
   - Optimize engagement timing

4. **Enhance User Experience**
   - Reduce friction points
   - Personalize content presentation
   - Streamline user journeys

### Secondary Objectives

1. **Business Intelligence**

   - Market trend analysis
   - Demand forecasting
   - Inventory optimization

2. **Quality Assurance**
   - Detect anomalies
   - Identify spam/abuse
   - Monitor system health

---

## User Interaction Categories

### 1. Explicit Interactions (High Signal)

User actions that clearly indicate preference:

```typescript
interface ExplicitInteraction {
  type:
    | "RATING" // User rates a perfume
    | "REVIEW" // User writes a review
    | "WISHLIST_ADD" // Adds to wishlist
    | "WISHLIST_REMOVE" // Removes from wishlist
    | "COLLECTION_ADD" // Adds to collection
    | "COLLECTION_UPDATE" // Updates collection item
    | "TRADE_OFFER" // Makes trade offer
    | "PURCHASE"; // Purchases perfume

  perfumeId: string;
  userId: string;
  timestamp: Date;
  value?: number; // For ratings
  metadata: Record<string, any>;
}
```

**Characteristics:**

- High confidence signal
- Clear user intent
- Actionable for recommendations
- Persistent preference indicator

### 2. Implicit Interactions (Medium Signal)

Actions that suggest interest:

```typescript
interface ImplicitInteraction {
  type:
    | "PAGE_VIEW" // Views perfume page
    | "SEARCH" // Searches for perfumes
    | "FILTER_APPLY" // Applies filters
    | "IMAGE_VIEW" // Views perfume image
    | "NOTE_EXPAND" // Expands notes section
    | "HOUSE_VIEW" // Views house page
    | "SIMILAR_VIEW" // Views similar perfumes
    | "COLLECTION_VIEW"; // Views user collection

  perfumeId?: string;
  userId: string;
  timestamp: Date;
  duration?: number; // Time spent
  metadata: Record<string, any>;
}
```

**Characteristics:**

- Moderate confidence signal
- May indicate browsing vs. interest
- Requires context and aggregation
- Useful in combination with other signals

### 3. Negative Signals (Important for Filtering)

Actions that indicate disinterest:

```typescript
interface NegativeSignal {
  type:
    | "QUICK_EXIT" // Leaves page quickly
    | "WISHLIST_REMOVE" // Removes from wishlist
    | "COLLECTION_REMOVE" // Removes from collection
    | "HIDE" // Hides perfume
    | "REPORT" // Reports content
    | "LOW_RATING"; // Rates poorly

  perfumeId: string;
  userId: string;
  timestamp: Date;
  reason?: string;
  metadata: Record<string, any>;
}
```

**Characteristics:**

- Prevents bad recommendations
- Indicates preferences by exclusion
- Critical for user satisfaction
- Should be weighted heavily

### 4. Contextual Signals

Environmental factors that influence behavior:

```typescript
interface ContextualSignal {
  userId: string;
  timestamp: Date;
  context: {
    device: "mobile" | "tablet" | "desktop";
    location?: string;
    timeOfDay: string;
    dayOfWeek: string;
    season: string;
    sessionId: string;
    referrer?: string;
    userAgent: string;
  };
}
```

**Characteristics:**

- Provides important context
- Affects recommendation timing
- Useful for personalization
- Privacy-sensitive (needs anonymization)

---

## Data Collection Points

### Frontend Tracking Events

#### Page-Level Events

```typescript
// app/utils/analytics/page-tracking.ts
export const pageTrackingEvents = {
  // Perfume Detail Page
  PERFUME_VIEW: {
    event: "perfume_view",
    data: {
      perfumeId: string,
      perfumeName: string,
      houseId: string,
      houseName: string,
      viewDuration: number,
      scrollDepth: number,
      source: "search" | "recommendation" | "direct" | "related",
    },
  },

  // Search Events
  SEARCH_PERFORMED: {
    event: "search_performed",
    data: {
      query: string,
      filters: FilterState,
      resultsCount: number,
      timestamp: Date,
    },
  },

  SEARCH_RESULT_CLICKED: {
    event: "search_result_clicked",
    data: {
      query: string,
      perfumeId: string,
      position: number,
      totalResults: number,
    },
  },

  // Filter Events
  FILTER_APPLIED: {
    event: "filter_applied",
    data: {
      filterType: string,
      filterValue: string,
      resultsCount: number,
    },
  },
};
```

#### Interaction Events

```typescript
// app/utils/analytics/interaction-tracking.ts
export const interactionTrackingEvents = {
  // Rating Events
  RATING_STARTED: {
    event: "rating_started",
    data: {
      perfumeId: string,
      category: string,
    },
  },

  RATING_COMPLETED: {
    event: "rating_completed",
    data: {
      perfumeId: string,
      ratings: RatingData,
      timeToComplete: number,
    },
  },

  // Wishlist Events
  WISHLIST_ADD: {
    event: "wishlist_add",
    data: {
      perfumeId: string,
      source: "detail_page" | "search" | "recommendation",
    },
  },

  WISHLIST_REMOVE: {
    event: "wishlist_remove",
    data: {
      perfumeId: string,
      timeInWishlist: number,
      reason: string,
    },
  },

  // Collection Events
  COLLECTION_ADD: {
    event: "collection_add",
    data: {
      perfumeId: string,
      collectionDetails: Partial<UserPerfume>,
    },
  },

  // Review Events
  REVIEW_STARTED: {
    event: "review_started",
    data: {
      perfumeId: string,
    },
  },

  REVIEW_SUBMITTED: {
    event: "review_submitted",
    data: {
      perfumeId: string,
      reviewLength: number,
      timeToWrite: number,
    },
  },
};
```

#### Engagement Events

```typescript
// app/utils/analytics/engagement-tracking.ts
export const engagementTrackingEvents = {
  // Image Interactions
  IMAGE_VIEWED: {
    event: "image_viewed",
    data: {
      perfumeId: string,
      imageIndex: number,
      viewDuration: number,
    },
  },

  // Note Interactions
  NOTES_EXPANDED: {
    event: "notes_expanded",
    data: {
      perfumeId: string,
      noteType: "open" | "heart" | "base",
      viewDuration: number,
    },
  },

  // Similar Perfumes
  SIMILAR_PERFUME_CLICKED: {
    event: "similar_perfume_clicked",
    data: {
      sourcePerfumeId: string,
      targetPerfumeId: string,
      position: number,
    },
  },

  // House Exploration
  HOUSE_VIEWED: {
    event: "house_viewed",
    data: {
      houseId: string,
      source: "perfume_page" | "search" | "direct",
    },
  },
};
```

### Backend Tracking

#### API Events

```typescript
// app/models/analytics/api-tracking.server.ts
export const apiTrackingEvents = {
  // API Usage
  API_CALL: {
    endpoint: string,
    method: string,
    userId: string,
    responseTime: number,
    statusCode: number,
    error: string,
  },

  // Database Operations
  DB_QUERY: {
    model: string,
    operation: "create" | "read" | "update" | "delete",
    userId: string,
    resourceId: string,
    duration: number,
  },
};
```

---

## Privacy & Compliance

### Data Privacy Principles

1. **User Consent**

   - Clear opt-in for analytics
   - Granular consent options
   - Easy opt-out mechanism

2. **Data Minimization**

   - Collect only necessary data
   - Aggregate when possible
   - Regular data pruning

3. **Anonymization**

   - Remove PII when possible
   - Hash sensitive identifiers
   - Aggregate for analytics

4. **Transparency**

   - Clear privacy policy
   - Data usage disclosure
   - User data access

5. **Security**
   - Encrypted storage
   - Access controls
   - Audit logging

### GDPR/CCPA Compliance

```typescript
// app/models/user-privacy.server.ts
export interface UserPrivacySettings {
  userId: string;

  // Consent flags
  analyticsConsent: boolean;
  personalizationConsent: boolean;
  marketingConsent: boolean;

  // Data retention
  dataRetentionDays: number;

  // Rights
  lastDataExport?: Date;
  lastDataDeletion?: Date;

  createdAt: Date;
  updatedAt: Date;
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Objectives:**

- Set up analytics infrastructure
- Implement core tracking events
- Create data storage schema

**Tasks:**

1. ✅ Audit existing data collection
2. ✅ Document data requirements
3. [ ] Design analytics database schema
4. [ ] Set up analytics service
5. [ ] Implement page view tracking
6. [ ] Implement interaction tracking
7. [ ] Create privacy consent UI

**Deliverables:**

- Analytics database schema
- Core tracking library
- Privacy consent system
- Documentation

### Phase 2: Enhanced Tracking (Week 3-4)

**Objectives:**

- Add comprehensive event tracking
- Implement session management
- Build analytics dashboard

**Tasks:**

1. [ ] Implement search tracking
2. [ ] Implement engagement tracking
3. [ ] Add session management
4. [ ] Build admin analytics dashboard
5. [ ] Create data export tools
6. [ ] Implement data retention policies

**Deliverables:**

- Comprehensive event tracking
- Session analytics
- Admin dashboard
- Data management tools

### Phase 3: AI Preparation (Week 5-6)

**Objectives:**

- Structure data for ML
- Build feature extraction
- Create training datasets

**Tasks:**

1. [ ] Create user interaction profiles
2. [ ] Build feature extraction pipeline
3. [ ] Generate training datasets
4. [ ] Implement similarity calculations
5. [ ] Create data quality checks
6. [ ] Build A/B testing framework

**Deliverables:**

- ML-ready datasets
- Feature extraction pipeline
- Quality assurance tools
- A/B testing framework

### Phase 4: Optimization (Week 7-8)

**Objectives:**

- Optimize performance
- Reduce storage costs
- Improve data quality

**Tasks:**

1. [ ] Optimize database queries
2. [ ] Implement data aggregation
3. [ ] Add caching layer
4. [ ] Create monitoring alerts
5. [ ] Performance tuning
6. [ ] Cost optimization

**Deliverables:**

- Optimized tracking system
- Monitoring dashboard
- Cost analysis report
- Performance benchmarks

---

## Success Metrics

### Data Collection Quality

- **Coverage:** 95%+ of user interactions tracked
- **Accuracy:** 99%+ event attribution accuracy
- **Latency:** <100ms tracking overhead
- **Reliability:** 99.9%+ event delivery rate

### Privacy & Compliance

- **Consent Rate:** 80%+ users opt-in
- **Response Time:** <1 sec for opt-out
- **Data Requests:** 100% fulfilled within 30 days
- **Compliance:** Zero violations

### Business Impact

- **Recommendation CTR:** +15% improvement
- **User Engagement:** +20% increase
- **Search Success:** +25% improvement
- **User Retention:** +10% increase

---

## Next Steps

1. **Immediate Actions:**

   - [ ] Review and approve this strategy document
   - [ ] Assign implementation team
   - [ ] Set up development environment
   - [ ] Schedule kickoff meeting

2. **Week 1 Priorities:**

   - [ ] Design analytics database schema
   - [ ] Implement basic page tracking
   - [ ] Create privacy consent UI
   - [ ] Set up monitoring infrastructure

3. **Stakeholder Review:**
   - [ ] Engineering review
   - [ ] Legal/compliance review
   - [ ] Product management approval
   - [ ] Privacy officer sign-off

---

## References

- [AI Integration Roadmap](../developer/AI_INTEGRATION_ROADMAP.md)
- [Privacy Policy](../../legal/privacy-policy.md) _(to be created)_
- [Database Schema](../../prisma/schema.prisma)
- [Current Analytics Implementation](../../app/utils/analytics/)

---

**Document Status:** Draft v1.0  
**Last Updated:** 2025-11-01  
**Next Review:** 2025-11-08  
**Owner:** Development Team
