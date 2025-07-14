# Film Noir Rating System

A comprehensive perfume rating system inspired by Fragrantica's rating categories, featuring a film noir aesthetic with animated SVG components.

## Features

### 🎭 Film Noir Aesthetic

- Vintage-inspired design with shadows and gradients
- Gold and dark color scheme reminiscent of classic cinema
- Art Deco styling with elegant typography

### ⭐ Animated SVG Rating Stars

- Smooth transitions and hover effects
- Vintage film noir shadow effects
- Responsive sizing (small, medium, large)

### 📊 Comprehensive Rating Categories

Based on Fragrantica's rating system with noir-themed names:

1. **Longevity** (1-5): Fleeting Shadow → Eternal Obsession
2. **Sillage** (1-5): Whispered Secret → Room Domination
3. **Gender Appeal** (1-5): Distinctly Feminine → Distinctly Masculine
4. **Price Value** (1-5): Highway Robbery → Stolen Treasure
5. **Overall** (1-5): Despise → Obsessed

### 🔐 User Authentication & Voting

- Prevents duplicate voting per user per perfume
- Allows users to update their existing ratings
- Guest users can view community averages (read-only)

### 🚀 Real-time Updates

- Optimistic UI updates for immediate feedback
- Server synchronization for data persistence
- Error handling and loading states

## Components

### NoirRating

Individual rating component for single categories.

```tsx
<NoirRating
  category="longevity"
  value={4}
  onChange={(rating) => handleRatingChange("longevity", rating)}
  size="lg"
  showLabel
/>
```

### PerfumeRatingSystem

Complete rating system for perfume detail pages.

```tsx
<PerfumeRatingSystem
  perfumeId="perfume-123"
  userId="user-456"
  userRatings={userRatings}
  averageRatings={averageRatings}
/>
```

## Database Schema

```prisma
model UserPerfumeRating {
  id         String   @id @default(cuid())
  userId     String
  perfumeId  String
  longevity  Int?     // 1-5: Fleeting Shadow to Eternal Obsession
  sillage    Int?     // 1-5: Whispered Secret to Room Domination
  gender     Int?     // 1-5: Distinctly Feminine to Distinctly Masculine
  priceValue Int?     // 1-5: Highway Robbery to Stolen Treasure
  overall    Int?     // 1-5: Despise to Obsessed
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  perfume    Perfume  @relation(fields: [perfumeId], references: [id])
  user       User     @relation(fields: [userId], references: [id])

  @@unique([userId, perfumeId])
}
```

## API Endpoints

### POST /api/ratings

Submit or update a rating for a specific category.

**Request Body:**

```json
{
  "userId": "user-123",
  "perfumeId": "perfume-456",
  "category": "longevity",
  "rating": 4
}
```

**Response:**

```json
{
  "success": true
}
```

## Server Functions

### Rating Management

- `createPerfumeRating()` - Create new rating
- `updatePerfumeRating()` - Update existing rating
- `getUserPerfumeRating()` - Get user's rating for a perfume
- `getPerfumeRatings()` - Get all ratings and averages for a perfume

## Demo

Visit `/rating-demo` to see the complete rating system in action with:

- Interactive rating components
- Read-only examples
- Complete perfume rating system
- Feature showcase

## Usage in Perfume Pages

To integrate the rating system into existing perfume detail pages:

1. Import the components:

```tsx
import PerfumeRatingSystem from "~/components/Containers/Perfume/PerfumeRatingSystem/PerfumeRatingSystem";
```

2. Add to your loader to fetch user ratings and averages:

```tsx
// In your route loader
const userRating = userId
  ? await getUserPerfumeRating(userId, perfumeId)
  : null;
const ratingStats = await getPerfumeRatings(perfumeId);
```

3. Include in your component:

```tsx
<PerfumeRatingSystem
  perfumeId={perfume.id}
  userId={user?.id}
  userRatings={userRating}
  averageRatings={ratingStats.averageRatings}
/>
```

## Technical Implementation

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS with custom noir color scheme
- **Backend**: Prisma ORM with PostgreSQL
- **Animations**: CSS transitions and SVG filters
- **State Management**: React hooks with optimistic updates
- **API**: React Router actions and loaders

## Color Scheme

```css
/* Noir color palette */
--noir-dark-900: #0a0a0a;
--noir-dark-800: #1a1a1a;
--noir-dark-700: #2d2d2d;
--noir-dark-600: #4a4a4a;
--noir-gold-300: #d4af37;
--noir-gold-200: #b8860b;
--noir-gold-400: #8b7355;
```

## Dependencies

- React 18+
- TypeScript
- Tailwind CSS
- Prisma
- React Router
- PostgreSQL

This rating system provides a comprehensive, user-friendly way for perfume enthusiasts to rate and discover fragrances with a distinctive film noir aesthetic that sets it apart from standard rating interfaces.
