# Feature Enhancements & Improvements

**Date:** January 2025  
**Focus:** New features and capability improvements  

---

## 🎯 Overview

This document outlines feature enhancements that would improve user experience, functionality, and engagement.

---

## 🚀 High-Priority Enhancements

### 1. Advanced Search & Filtering

#### Current State
- Basic search by name
- Letter-based filtering
- Simple sort options

#### Enhancement
```typescript
// Multi-faceted search with filters
interface SearchFilters {
  query?: string
  houseName?: string
  houseType?: HouseType[]
  priceRange?: { min: number; max: number }
  ratings?: { min: number }
  availability?: "available" | "all"
  sortBy?: "name" | "price" | "rating" | "popularity"
  order?: "asc" | "desc"
}

// API endpoint
export async function loader({ request }: LoaderFunctionArgs) {
  const filters = parseSearchFilters(request.url)
  
  const results = await prisma.perfume.findMany({
    where: {
      AND: [
        filters.query && {
          OR: [
            { name: { contains: filters.query, mode: "insensitive" } },
            { description: { contains: filters.query, mode: "insensitive" } }
          ]
        },
        filters.houseName && {
          perfumeHouse: {
            name: { contains: filters.houseName, mode: "insensitive" }
          }
        },
        filters.houseType && {
          perfumeHouse: { type: { in: filters.houseType } }
        }
      ].filter(Boolean)
    },
    include: {
      perfumeHouse: true,
      _count: {
        select: {
          UserPerfumeRating: true,
          UserPerfume: {
            where: { available: { not: "0" } }
          }
        }
      }
    },
    orderBy: buildSortOrder(filters.sortBy, filters.order)
  })
  
  return Response.json(results)
}
```

**User Benefits:**
- Find perfumes by multiple criteria
- Save searches
- Better discovery experience

---

### 2. Recommendations Engine

#### Implementation
```typescript
// AI-powered recommendations
interface RecommendationEngine {
  // Based on user's collection
  similarToCollection(userId: string): Promise<Perfume[]>
  
  // Based on notes
  byNotes(noteIds: string[]): Promise<Perfume[]>
  
  // Popular in community
  trending(): Promise<Perfume[]>
  
  // From same house
  fromFavoriteHouses(userId: string): Promise<Perfume[]>
}

// Usage in recommendations page
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request)
  
  const recommendations = await Promise.all([
    getSimilarToCollection(user.id),
    getTrending(),
    getFromFavoriteHouses(user.id)
  ])
  
  return Response.json({
    personalized: recommendations[0],
    trending: recommendations[1],
    houseMatches: recommendations[2]
  })
}
```

**User Benefits:**
- Discover new perfumes
- Personalized suggestions
- Improved engagement

---

### 3. Social Features

#### A. User Profiles
```typescript
// Enhanced profile pages
interface UserProfile {
  // Current
  id: string
  username: string
  firstName: string
  lastName: string
  
  // New additions
  bio?: string
  avatar?: string
  location?: string
  joinedDate: Date
  stats: {
    collectionSize: number
    wishlistSize: number
    reviewsWritten: number
    helpfulVotes: number
  }
  favoriteHouses: PerfumeHouse[]
  recentActivity: Activity[]
  badges?: Badge[]
}

// Profile stats component
export function ProfileStats({ user }: { user: UserProfile }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard 
        label="Collection" 
        value={user.stats.collectionSize}
        icon={<CollectionIcon />}
      />
      <StatCard 
        label="Wishlist" 
        value={user.stats.wishlistSize}
        icon={<HeartIcon />}
      />
      <StatCard 
        label="Reviews" 
        value={user.stats.reviewsWritten}
        icon={<ReviewIcon />}
      />
      <StatCard 
        label="Helpful" 
        value={user.stats.helpfulVotes}
        icon={<ThumbsUpIcon />}
      />
    </div>
  )
}
```

#### B. Following & Followers
```typescript
// Social connections
model UserFollow {
  id       String   @id @default(cuid())
  followerId String
  followingId String
  createdAt DateTime @default(now())
  
  follower  User @relation("Followers", fields: [followerId], references: [id])
  following User @relation("Following", fields: [followingId], references: [id])
  
  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
}

// Activity feed
export async function getActivityFeed(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      following: {
        select: {
          following: {
            select: {
              activities: {
                orderBy: { createdAt: "desc" },
                take: 50
              }
            }
          }
        }
      }
    }
  })
}
```

**User Benefits:**
- Build community
- Share interests
- Discover through others

---

### 4. Enhanced Trading Features

#### Current State
- Basic collection management
- Wishlist functionality
- Simple trading interface

#### Enhancements

**A. Offer System**
```typescript
// Trade offers
model TradeOffer {
  id           String   @id @default(cuid())
  fromUserId   String
  toUserId     String
  offeredItems UserPerfume[] // Items from offerer
  requestedItems UserPerfume[] // Items from recipient
  status       OfferStatus @default(pending)
  message      String?
  createdAt    DateTime @default(now())
  expiresAt    DateTime
  
  fromUser User @relation("OffersMade", fields: [fromUserId], references: [id])
  toUser   User @relation("OffersReceived", fields: [toUserId], references: [id])
  
  @@index([fromUserId])
  @@index([toUserId])
  @@index([status])
}

enum OfferStatus {
  pending
  accepted
  declined
  expired
  cancelled
}
```

**B. Market Insights**
```typescript
// Market value tracking
interface MarketData {
  perfume: Perfume
  averagePrice: number
  priceRange: { min: number; max: number }
  availability: number
  trendingScore: number
  priceTrend: "up" | "down" | "stable"
}

export async function getMarketInsights(perfumeId: string) {
  const [listings, wishlistCount, reviews] = await Promise.all([
    prisma.userPerfume.findMany({
      where: { perfumeId, available: { not: "0" } },
      select: { price: true }
    }),
    prisma.userPerfumeWishlist.count({
      where: { perfumeId }
    }),
    prisma.userPerfumeRating.findMany({
      where: { perfumeId, overall: { not: null } },
      select: { overall: true }
    })
  ])
  
  const prices = listings.map(l => parseFloat(l.price || "0"))
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
  
  return {
    averagePrice: avgPrice,
    priceRange: {
      min: Math.min(...prices),
      max: Math.max(...prices)
    },
    availability: listings.length,
    demand: wishlistCount,
    averageRating: reviews.reduce((a, b) => a + (b.overall || 0), 0) / reviews.length,
    trendingScore: calculateTrendingScore(listings, wishlistCount)
  }
}
```

---

### 5. Notification System

#### Current State
- Basic wishlist alerts
- Decant interest notifications

#### Enhancement
```typescript
// Comprehensive notification system
interface NotificationPreferences {
  wishlistAvailable: boolean
  newFollower: boolean
  tradeOffer: boolean
  tradeAccepted: boolean
  reviewAdded: boolean
  houseFollowed: boolean
  commentReply: boolean
  weeklyDigest: boolean
  emailDigest: boolean
}

// Notification types
enum NotificationType {
  wishlist_available
  trade_offer
  trade_accepted
  new_follower
  review_liked
  comment_reply
  collection_milestone
  weekly_digest
}

// Notifications component
export function NotificationCenter() {
  const { notifications, unreadCount } = useNotifications()
  
  return (
    <div className="relative">
      <Button variant="ghost" className="relative">
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs">
            {unreadCount}
          </span>
        )}
      </Button>
      
      <NotificationList notifications={notifications} />
    </div>
  )
}
```

---

### 6. Analytics Dashboard

#### For Users
```typescript
// Personal analytics
interface UserAnalytics {
  collectionValue: number
  mostWorn: Perfume[]
  seasonalUsage: SeasonUsage[]
  houseDistribution: { house: string; count: number }[]
  wishlistValue: number
  collectionTrend: TrendData[]
}

// Analytics page
export function UserAnalyticsPage() {
  const analytics = useUserAnalytics()
  
  return (
    <div className="space-y-8">
      <OverviewCards analytics={analytics} />
      <SeasonalChart data={analytics.seasonalUsage} />
      <HouseDistribution data={analytics.houseDistribution} />
      <TrendChart data={analytics.collectionTrend} />
    </div>
  )
}
```

#### For Houses (Admin)
```typescript
// House-level analytics
interface HouseAnalytics {
  totalPerfumes: number
  totalListings: number
  averagePrice: number
  wishlistCount: number
  reviewAverage: number
  popularityTrend: TrendData[]
  topPerformers: Perfume[]
}

// Dashboard
export function HouseAnalyticsDashboard({ houseId }: { houseId: string }) {
  const analytics = useHouseAnalytics(houseId)
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <MetricCard title="Listings" value={analytics.totalListings} />
      <MetricCard title="Avg Price" value={analytics.averagePrice} />
      <MetricCard title="Wishlist" value={analytics.wishlistCount} />
      <MetricCard title="Rating" value={analytics.reviewAverage} />
    </div>
  )
}
```

---

## 📋 Feature Enhancement Checklist

### Phase 1 (High Priority)
- [ ] Advanced search & filtering
- [ ] Recommendations engine
- [ ] Enhanced user profiles
- [ ] Notification system
- [ ] Trade offer system

### Phase 2 (Medium Priority)
- [ ] Social features (following/followers)
- [ ] Analytics dashboards
- [ ] Market insights
- [ ] Collection sharing
- [ ] Badge system

### Phase 3 (Future)
- [ ] Mobile apps (iOS/Android)
- [ ] Voice search
- [ ] AR try-on features
- [ ] AI scent descriptions
- [ ] Virtual events

---

## 💡 Additional Feature Ideas

### Quick Wins
1. **Dark Mode Toggle** - Theme switcher
2. **Keyboard Shortcuts** - Navigation shortcuts
3. **Export Collection** - CSV/PDF export
4. **Import from Fragrantica** - Data migration tool
5. **Printable Labels** - For collection organization

### Engagement Features
1. **Daily Discovery** - Perfume of the day
2. **Scent of the Week** - Featured perfume
3. **Community Challenges** - Collection goals
4. **Tasting Notes Game** - Educational interactive
5. **Vintage Finds** - Rare perfume highlights

### Utility Features
1. **Barcode Scanner** - Quick add by scanning
2. **Batch Import** - Import multiple items
3. **Collection Templates** - Pre-made collections
4. **Seasonal Suggestions** - Weather-based recommendations
5. **Storage Location Tracking** - Organize collection

---

**Next Steps:** See [Application Ideas](./07-APPLICATION-IDEAS.md) for strategic initiatives.

