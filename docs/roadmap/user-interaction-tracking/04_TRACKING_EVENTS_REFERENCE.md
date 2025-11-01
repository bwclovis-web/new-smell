# User Interaction Tracking Events - Quick Reference

**Document Type:** Quick Reference Guide  
**Version:** 1.0  
**Last Updated:** 2025-11-01  
**For:** Developers implementing tracking

---

## Quick Access

Jump to section:

- [View Events](#view-events)
- [Search Events](#search-events)
- [Filter Events](#filter-events)
- [Rating Events](#rating-events)
- [Review Events](#review-events)
- [Collection Events](#collection-events)
- [Wishlist Events](#wishlist-events)
- [Engagement Events](#engagement-events)
- [Navigation Events](#navigation-events)
- [Social Events](#social-events)

---

## Event Tracking Basics

### How to Track an Event

```typescript
import { analytics } from "~/utils/analytics/analytics-sdk"

// Simple tracking
analytics.track({
  eventType: "PAGE_VIEW",
  eventCategory: "VIEW",
  path: window.location.pathname,
})

// With additional data
analytics.track({
  eventType: "PERFUME_VIEW",
  eventCategory: "VIEW",
  path: window.location.pathname,
  perfumeId: "perfume-123",
  eventData: { source: "search" },
  duration: 5000,
})
```

### Event Structure

All events follow this structure:

```typescript
interface TrackingEvent {
  // Required
  eventType: InteractionEventType // What happened
  eventCategory: InteractionCategory // Category grouping
  path: string // Current URL path

  // Optional but recommended
  perfumeId?: string // Related perfume
  houseId?: string // Related house
  eventData?: Record<string, any> // Additional context
  duration?: number // Duration in ms
  value?: number // Numeric value

  // Auto-populated
  userId?: string // Logged in user
  sessionId: string // Session ID
  timestamp: Date // Event time
  userAgent?: string // Browser info
}
```

---

## View Events

### PAGE_VIEW

**When:** User navigates to any page  
**Category:** VIEW  
**Auto-tracked:** Yes (via `usePageTracking()` hook)

```typescript
analytics.track({
  eventType: "PAGE_VIEW",
  eventCategory: "VIEW",
  path: "/perfume/aventus",
})
```

### PERFUME_VIEW

**When:** User views a perfume detail page  
**Category:** VIEW  
**Auto-tracked:** Yes (via `usePerfumeViewTracking()` hook)

```typescript
trackPerfumeView(perfumeId, path, source)

// Example
trackPerfumeView("perfume-123", "/perfume/aventus", "search")
```

**Event Data:**

```typescript
{
  source?: 'search' | 'recommendation' | 'direct' | 'related' | 'house'
  scrollDepth?: number    // Percentage scrolled (0-100)
  timeToInteraction?: number  // Time to first interaction (ms)
}
```

### HOUSE_VIEW

**When:** User views a perfume house page  
**Category:** VIEW

```typescript
analytics.track({
  eventType: "HOUSE_VIEW",
  eventCategory: "VIEW",
  path: "/house/creed",
  houseId: "house-456",
  eventData: { source: "perfume_page" },
})
```

### COLLECTION_VIEW

**When:** User views another user's collection  
**Category:** VIEW

```typescript
analytics.track({
  eventType: "COLLECTION_VIEW",
  eventCategory: "VIEW",
  path: "/collection/user-123",
  eventData: {
    targetUserId: "user-123",
    perfumeCount: 45,
  },
})
```

---

## Search Events

### SEARCH_PERFORMED

**When:** User submits a search query  
**Category:** SEARCH

```typescript
trackSearch(query, filters, resultsCount, path)

// Example
trackSearch(
  "woody oriental",
  { houses: ["creed"], priceRange: { min: 0, max: 100 } },
  23,
  "/the-vault"
)
```

**Event Data:**

```typescript
{
  query: string              // Search text
  filters: {
    houses?: string[]
    notes?: string[]
    priceRange?: { min: number; max: number }
    perfumeType?: string[]
    availability?: boolean
    tradeable?: boolean
  }
  resultsCount: number       // Total results found
  queryType?: 'text' | 'voice' | 'filter_only'
}
```

### SEARCH_RESULT_CLICKED

**When:** User clicks on a search result  
**Category:** SEARCH

```typescript
analytics.track({
  eventType: "SEARCH_RESULT_CLICKED",
  eventCategory: "SEARCH",
  path: "/the-vault",
  perfumeId: "perfume-123",
  eventData: {
    query: "woody oriental",
    position: 3, // Position in results (1-based)
    totalResults: 23,
  },
})
```

### SEARCH_REFINED

**When:** User modifies an existing search  
**Category:** SEARCH

```typescript
analytics.track({
  eventType: "SEARCH_REFINED",
  eventCategory: "SEARCH",
  path: "/the-vault",
  eventData: {
    originalQuery: "woody",
    newQuery: "woody oriental",
    originalFilters: {},
    newFilters: { houses: ["creed"] },
  },
})
```

### SEARCH_NO_RESULTS

**When:** Search returns zero results  
**Category:** SEARCH

```typescript
analytics.track({
  eventType: "SEARCH_NO_RESULTS",
  eventCategory: "SEARCH",
  path: "/the-vault",
  eventData: {
    query: "very-rare-perfume",
    filters: {},
  },
})
```

---

## Filter Events

### FILTER_APPLIED

**When:** User applies a filter  
**Category:** FILTER

```typescript
analytics.track({
  eventType: "FILTER_APPLIED",
  eventCategory: "FILTER",
  path: "/the-vault",
  eventData: {
    filterType: "house",
    filterValue: "creed",
    resultsCount: 45,
    previousResultsCount: 1250,
  },
})
```

### FILTER_REMOVED

**When:** User removes a filter  
**Category:** FILTER

```typescript
analytics.track({
  eventType: "FILTER_REMOVED",
  eventCategory: "FILTER",
  path: "/the-vault",
  eventData: {
    filterType: "house",
    filterValue: "creed",
    resultsCount: 1250,
  },
})
```

### FILTER_CLEARED

**When:** User clears all filters  
**Category:** FILTER

```typescript
analytics.track({
  eventType: "FILTER_CLEARED",
  eventCategory: "FILTER",
  path: "/the-vault",
  eventData: {
    previousFilters: {
      houses: ["creed", "tom-ford"],
      priceRange: { min: 0, max: 100 },
    },
    resultsCount: 1250,
  },
})
```

---

## Rating Events

### RATING_STARTED

**When:** User begins rating a perfume  
**Category:** RATING

```typescript
analytics.track({
  eventType: "RATING_STARTED",
  eventCategory: "RATING",
  path: "/perfume/aventus",
  perfumeId: "perfume-123",
  eventData: {
    category: "longevity",
  },
})
```

### RATING_COMPLETED

**When:** User submits a rating  
**Category:** RATING  
**Auto-tracked:** Partially (use `trackRating()` helper)

```typescript
trackRating({
  userId: "user-123",
  sessionId: "session-456",
  perfumeId: "perfume-789",
  ratings: {
    overall: 4,
    longevity: 5,
    sillage: 4,
    priceValue: 3,
    gender: 4,
  },
  timeToComplete: 45000, // 45 seconds
  userAgent: navigator.userAgent,
  path: "/perfume/aventus",
})
```

**Event Data:**

```typescript
{
  ratings: {
    overall?: number      // 1-5
    longevity?: number    // 1-5
    sillage?: number      // 1-5
    priceValue?: number   // 1-5
    gender?: number       // 1-5
  }
  timeToComplete?: number    // milliseconds
  categoriesRated: number    // How many categories rated
  hadPreviousRating: boolean // Was this an update?
}
```

### RATING_UPDATED

**When:** User updates an existing rating  
**Category:** RATING

```typescript
analytics.track({
  eventType: "RATING_UPDATED",
  eventCategory: "RATING",
  path: "/perfume/aventus",
  perfumeId: "perfume-123",
  eventData: {
    previousRatings: { overall: 3, longevity: 4 },
    newRatings: { overall: 4, longevity: 5 },
    changedCategories: ["overall", "longevity"],
  },
})
```

---

## Review Events

### REVIEW_STARTED

**When:** User begins writing a review  
**Category:** REVIEW

```typescript
analytics.track({
  eventType: "REVIEW_STARTED",
  eventCategory: "REVIEW",
  path: "/perfume/aventus",
  perfumeId: "perfume-123",
})
```

### REVIEW_SUBMITTED

**When:** User submits a review  
**Category:** REVIEW

```typescript
analytics.track({
  eventType: "REVIEW_SUBMITTED",
  eventCategory: "REVIEW",
  path: "/perfume/aventus",
  perfumeId: "perfume-123",
  eventData: {
    reviewLength: 245, // Character count
    timeToWrite: 120000, // 2 minutes in ms
    wordCount: 45,
  },
})
```

### REVIEW_UPDATED

**When:** User edits an existing review  
**Category:** REVIEW

```typescript
analytics.track({
  eventType: "REVIEW_UPDATED",
  eventCategory: "REVIEW",
  path: "/perfume/aventus",
  perfumeId: "perfume-123",
  eventData: {
    previousLength: 200,
    newLength: 245,
    timeSinceOriginal: 86400000, // 1 day
  },
})
```

---

## Collection Events

### COLLECTION_ADD

**When:** User adds perfume to collection  
**Category:** COLLECTION  
**Auto-tracked:** Use `trackCollectionAdd()` helper

```typescript
trackCollectionAdd(perfumeId, path)

// Or with details
analytics.track({
  eventType: "COLLECTION_ADD",
  eventCategory: "COLLECTION",
  path: "/perfume/aventus",
  perfumeId: "perfume-123",
  eventData: {
    source: "detail_page",
    amount: "100ml",
    price: "350",
    tradePreference: "both",
  },
})
```

### COLLECTION_UPDATE

**When:** User updates collection item details  
**Category:** COLLECTION

```typescript
analytics.track({
  eventType: "COLLECTION_UPDATE",
  eventCategory: "COLLECTION",
  path: "/my-collection",
  perfumeId: "perfume-123",
  eventData: {
    changedFields: ["available", "price"],
    previousValues: { available: "50ml", price: "350" },
    newValues: { available: "30ml", price: "300" },
  },
})
```

### COLLECTION_REMOVE

**When:** User removes perfume from collection  
**Category:** COLLECTION

```typescript
analytics.track({
  eventType: "COLLECTION_REMOVE",
  eventCategory: "COLLECTION",
  path: "/my-collection",
  perfumeId: "perfume-123",
  eventData: {
    timeInCollection: 2592000000, // 30 days in ms
    reason: "sold",
  },
})
```

---

## Wishlist Events

### WISHLIST_ADD

**When:** User adds perfume to wishlist  
**Category:** WISHLIST  
**Auto-tracked:** Use `trackWishlistAdd()` helper

```typescript
trackWishlistAdd(perfumeId, path, source)

// Example
trackWishlistAdd("perfume-123", "/perfume/aventus", "detail_page")
```

**Event Data:**

```typescript
{
  source: 'detail_page' | 'search' | 'recommendation' | 'related'
  fromRecommendation?: boolean
  recommendationId?: string
}
```

### WISHLIST_REMOVE

**When:** User removes perfume from wishlist  
**Category:** WISHLIST

```typescript
analytics.track({
  eventType: "WISHLIST_REMOVE",
  eventCategory: "WISHLIST",
  path: "/my-wishlist",
  perfumeId: "perfume-123",
  eventData: {
    timeInWishlist: 604800000, // 7 days in ms
    reason: "purchased" | "not_interested" | "found_alternative",
  },
})
```

---

## Engagement Events

### IMAGE_VIEWED

**When:** User views/clicks on perfume image  
**Category:** ENGAGEMENT

```typescript
analytics.track({
  eventType: "IMAGE_VIEWED",
  eventCategory: "ENGAGEMENT",
  path: "/perfume/aventus",
  perfumeId: "perfume-123",
  eventData: {
    imageIndex: 0,
    viewDuration: 3000, // 3 seconds
    zoomed: false,
  },
})
```

### IMAGE_ZOOMED

**When:** User zooms into perfume image  
**Category:** ENGAGEMENT

```typescript
analytics.track({
  eventType: "IMAGE_ZOOMED",
  eventCategory: "ENGAGEMENT",
  path: "/perfume/aventus",
  perfumeId: "perfume-123",
  eventData: {
    imageIndex: 0,
    zoomLevel: 2.5,
  },
})
```

### NOTES_EXPANDED

**When:** User expands perfume notes section  
**Category:** ENGAGEMENT

```typescript
analytics.track({
  eventType: "NOTES_EXPANDED",
  eventCategory: "ENGAGEMENT",
  path: "/perfume/aventus",
  perfumeId: "perfume-123",
  eventData: {
    noteType: "heart", // 'open', 'heart', 'base'
    expandDuration: 8000, // How long expanded (ms)
  },
})
```

### SIMILAR_CLICKED

**When:** User clicks on similar perfume recommendation  
**Category:** ENGAGEMENT

```typescript
analytics.track({
  eventType: "SIMILAR_CLICKED",
  eventCategory: "ENGAGEMENT",
  path: "/perfume/aventus",
  perfumeId: "perfume-123", // Source perfume
  eventData: {
    targetPerfumeId: "perfume-456", // Clicked perfume
    position: 2,
    similarityReason: "same_notes",
  },
})
```

### HOUSE_LINK_CLICKED

**When:** User clicks on house link from perfume page  
**Category:** ENGAGEMENT

```typescript
analytics.track({
  eventType: "HOUSE_LINK_CLICKED",
  eventCategory: "ENGAGEMENT",
  path: "/perfume/aventus",
  perfumeId: "perfume-123",
  houseId: "house-456",
  eventData: {
    location: "header" | "details" | "breadcrumb",
  },
})
```

---

## Navigation Events

### NAVIGATION_CLICK

**When:** User clicks navigation menu  
**Category:** NAVIGATION

```typescript
analytics.track({
  eventType: "NAVIGATION_CLICK",
  eventCategory: "NAVIGATION",
  path: "/current-page",
  eventData: {
    linkText: "The Vault",
    targetPath: "/the-vault",
    menuType: "main" | "footer" | "mobile",
  },
})
```

### BACK_BUTTON

**When:** User uses browser back button  
**Category:** NAVIGATION

```typescript
analytics.track({
  eventType: "BACK_BUTTON",
  eventCategory: "NAVIGATION",
  path: "/perfume/aventus",
  eventData: {
    previousPath: "/the-vault",
    timeOnPage: 15000, // 15 seconds
  },
})
```

### EXTERNAL_LINK

**When:** User clicks external link  
**Category:** NAVIGATION

```typescript
analytics.track({
  eventType: "EXTERNAL_LINK",
  eventCategory: "NAVIGATION",
  path: "/perfume/aventus",
  eventData: {
    url: "https://external-site.com",
    linkText: "Buy Now",
  },
})
```

---

## Social Events

### PROFILE_VIEWED

**When:** User views another user's profile  
**Category:** SOCIAL

```typescript
analytics.track({
  eventType: "PROFILE_VIEWED",
  eventCategory: "SOCIAL",
  path: "/profile/user-123",
  eventData: {
    targetUserId: "user-123",
    source: "collection" | "review" | "trade" | "search",
  },
})
```

### COLLECTION_SHARED

**When:** User shares their collection  
**Category:** SOCIAL

```typescript
analytics.track({
  eventType: "COLLECTION_SHARED",
  eventCategory: "SOCIAL",
  path: "/my-collection",
  eventData: {
    method: "link" | "email" | "social",
    platform: "twitter" | "facebook" | "instagram",
  },
})
```

### TRADE_INQUIRY

**When:** User sends trade inquiry  
**Category:** SOCIAL

```typescript
analytics.track({
  eventType: "TRADE_INQUIRY",
  eventCategory: "SOCIAL",
  path: "/collection/user-123",
  perfumeId: "perfume-123",
  eventData: {
    targetUserId: "user-123",
    offerType: "cash" | "trade" | "both",
    message: boolean, // Did they include a message?
  },
})
```

---

## Conversion Events

### TRADE_OFFERED

**When:** User makes a trade offer  
**Category:** CONVERSION

```typescript
analytics.track({
  eventType: "TRADE_OFFERED",
  eventCategory: "CONVERSION",
  path: "/trade/new",
  perfumeId: "perfume-123",
  value: 350, // Offer value
  eventData: {
    targetUserId: "user-456",
    offerType: "cash" | "trade",
    perfumesOffered: ["perfume-789"],
  },
})
```

### TRADE_ACCEPTED

**When:** User accepts a trade offer  
**Category:** CONVERSION

```typescript
analytics.track({
  eventType: "TRADE_ACCEPTED",
  eventCategory: "CONVERSION",
  path: "/trade/123",
  perfumeId: "perfume-123",
  value: 350,
  eventData: {
    tradeId: "trade-123",
    timeToAccept: 3600000, // 1 hour
  },
})
```

### TRADE_DECLINED

**When:** User declines a trade offer  
**Category:** CONVERSION

```typescript
analytics.track({
  eventType: "TRADE_DECLINED",
  eventCategory: "CONVERSION",
  path: "/trade/123",
  perfumeId: "perfume-123",
  eventData: {
    tradeId: "trade-123",
    reason: "price" | "not_interested" | "other",
    counterOffer: boolean,
  },
})
```

---

## Helper Functions

### Convenience Tracking Functions

Located in `app/utils/analytics/analytics-sdk.ts`:

```typescript
// Page tracking (auto-called via usePageTracking hook)
trackPageView(path: string, perfumeId?: string)

// Perfume tracking (auto-called via usePerfumeViewTracking hook)
trackPerfumeView(perfumeId: string, path: string, source?: string)

// Search tracking
trackSearch(
  query: string,
  filters: Record<string, any>,
  resultsCount: number,
  path: string
)

// Rating tracking
trackRating({
  userId: string,
  sessionId: string,
  perfumeId: string,
  ratings: Record<string, number>,
  timeToComplete?: number,
  userAgent?: string,
  path: string
})

// Wishlist tracking
trackWishlistAdd(perfumeId: string, path: string, source?: string)
trackWishlistRemove(perfumeId: string, path: string, reason?: string)

// Collection tracking
trackCollectionAdd(perfumeId: string, path: string)
trackCollectionUpdate(perfumeId: string, path: string, changes: object)
trackCollectionRemove(perfumeId: string, path: string, reason?: string)
```

### React Hooks

Located in `app/hooks/useAnalytics.ts`:

```typescript
// Automatically track page views
usePageTracking()

// Track perfume view with duration
usePerfumeViewTracking(perfumeId: string, source?: string)

// Track time spent on element
useTimeTracking(callback: (duration: number) => void)
```

---

## Best Practices

### 1. Always Include Context

```typescript
// ❌ Bad - minimal context
analytics.track({
  eventType: "PERFUME_VIEW",
  eventCategory: "VIEW",
  path: "/perfume/aventus",
})

// ✅ Good - rich context
analytics.track({
  eventType: "PERFUME_VIEW",
  eventCategory: "VIEW",
  path: "/perfume/aventus",
  perfumeId: "perfume-123",
  eventData: {
    source: "search",
    query: "woody oriental",
    position: 3,
  },
})
```

### 2. Use Helper Functions

```typescript
// ❌ Manual tracking (more code, more mistakes)
analytics.track({
  eventType: "WISHLIST_ADD",
  eventCategory: "WISHLIST",
  path: window.location.pathname,
  perfumeId: perfume.id,
  eventData: { source: "detail_page" },
})

// ✅ Use helper (less code, consistent)
trackWishlistAdd(perfume.id, window.location.pathname, "detail_page")
```

### 3. Use React Hooks for Pages

```typescript
// ❌ Manual page tracking
useEffect(() => {
  trackPageView(location.pathname)
}, [location.pathname])

// ✅ Use hook (automatic, no duplicates)
usePageTracking()
```

### 4. Track User Intent

```typescript
// Track both the action AND the outcome
const handleSearch = async (query) => {
  const results = await searchPerfumes(query)

  trackSearch(query, filters, results.length, pathname)

  if (results.length === 0) {
    analytics.track({
      eventType: "SEARCH_NO_RESULTS",
      eventCategory: "SEARCH",
      path: pathname,
      eventData: { query, filters },
    })
  }
}
```

### 5. Don't Block User Experience

```typescript
// ❌ Waiting for tracking (blocks user)
await analytics.track({ ... })
router.push('/next-page')

// ✅ Fire and forget (non-blocking)
analytics.track({ ... })
router.push('/next-page')
```

---

## Testing

### Check if Event is Tracked

```typescript
// In browser console
sessionStorage.getItem("analyticsSessionId")

// Check network tab for /api/analytics calls
// Look for batched events every 5 seconds
```

### Manual Event Trigger

```typescript
import { analytics } from "~/utils/analytics/analytics-sdk"

// Trigger test event
analytics.track({
  eventType: "PAGE_VIEW",
  eventCategory: "VIEW",
  path: "/test",
  eventData: { test: true },
})

// Force flush immediately (instead of waiting)
analytics.flush()
```

---

## Troubleshooting

### Events Not Appearing in Database

1. Check browser console for errors
2. Verify `/api/analytics` endpoint returns 200
3. Check sessionId exists in sessionStorage
4. Ensure event structure is valid
5. Check database connection

### Events Missing Data

1. Verify all required fields are provided
2. Check if helper function is used correctly
3. Ensure perfumeId/houseId exists in database
4. Check eventData structure

### Performance Issues

1. Reduce `maxQueueSize` if batches are too large
2. Increase `flushInterval` if tracking too frequently
3. Use async processing for aggregations
4. Check database query performance

---

## Related Documentation

- [User Interaction Data Collection Strategy](./01_USER_INTERACTION_DATA_COLLECTION_STRATEGY.md)
- [User Interaction Data Model](./02_USER_INTERACTION_DATA_MODEL.md)
- [Implementation Guide](./03_INTERACTION_TRACKING_IMPLEMENTATION.md)

---

**Last Updated:** 2025-11-01  
**Maintained By:** Development Team
