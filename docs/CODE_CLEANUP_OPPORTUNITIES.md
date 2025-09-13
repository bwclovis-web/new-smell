# Code Cleanup Opportunities for Voodoo Perfumes

## Current Code Quality Assessment

### Strengths

- ✅ TypeScript implementation with good type safety
- ✅ ESLint configuration with comprehensive rules
- ✅ Component-based architecture
- ✅ Prisma ORM for database management
- ✅ Modern React patterns with hooks

### Areas for Improvement

- 🔄 Inconsistent error handling patterns
- 🔄 Mixed file naming conventions
- 🔄 Some components are too large
- 🔄 Duplicate code in multiple places
- 🔄 Missing documentation in many areas

## 1. File Structure and Organization

### Current Issues

- Mixed naming conventions (camelCase vs kebab-case)
- Some components in wrong directories
- Missing index files for clean imports
- Inconsistent file organization

### Recommended Structure

```
app/
├── components/
│   ├── atoms/           # Basic UI elements
│   ├── molecules/       # Simple component combinations
│   ├── organisms/       # Complex components
│   └── templates/       # Page layouts
├── services/            # Business logic
├── utils/              # Pure utility functions
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── constants/          # Application constants
└── lib/                # Third-party library configurations
```

### Implementation

```typescript
// Create app/components/index.ts
export { Button } from "./atoms/Button";
export { Input } from "./atoms/Input";
export { SearchBar } from "./molecules/SearchBar";
export { PerfumeCard } from "./organisms/PerfumeCard";
export { AdminLayout } from "./templates/AdminLayout";

// Create app/services/index.ts
export { PerfumeService } from "./perfume.service";
export { UserService } from "./user.service";
export { CacheService } from "./cache.service";

// Create app/utils/index.ts
export { formatDate } from "./date.utils";
export { validateEmail } from "./validation.utils";
export { debounce } from "./performance.utils";
```

## 2. Component Refactoring

### Large Component Breakdown

```typescript
// Before: Large PerfumeRatingSystem component
// After: Break into smaller, focused components

// Create app/components/atoms/RatingStar/RatingStar.tsx
interface RatingStarProps {
  value: number;
  maxValue: number;
  onSelect: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function RatingStar({
  value,
  maxValue,
  onSelect,
  readonly = false,
  size = "md",
}: RatingStarProps) {
  return (
    <div className={`rating-stars rating-stars--${size}`}>
      {Array.from({ length: maxValue }, (_, index) => (
        <button
          key={index}
          className={`star ${index < value ? "star--active" : ""}`}
          onClick={() => !readonly && onSelect(index + 1)}
          disabled={readonly}
          aria-label={`Rate ${index + 1} out of ${maxValue}`}
        >
          ⭐
        </button>
      ))}
    </div>
  );
}

// Create app/components/molecules/RatingCategory/RatingCategory.tsx
interface RatingCategoryProps {
  category: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  readonly?: boolean;
}

export function RatingCategory({
  category,
  label,
  value,
  onChange,
  readonly = false,
}: RatingCategoryProps) {
  return (
    <div className="rating-category">
      <label className="rating-category__label">{label}</label>
      <RatingStar
        value={value}
        maxValue={5}
        onSelect={onChange}
        readonly={readonly}
      />
    </div>
  );
}

// Refactored PerfumeRatingSystem
export function PerfumeRatingSystem({
  perfumeId,
  userId,
  userRatings,
  averageRatings,
  readonly = false,
}: PerfumeRatingSystemProps) {
  const categories = [
    { key: "longevity", label: "Longevity" },
    { key: "sillage", label: "Sillage" },
    { key: "gender", label: "Gender Appeal" },
    { key: "priceValue", label: "Price Value" },
    { key: "overall", label: "Overall Rating" },
  ];

  return (
    <div className="perfume-rating-system">
      {categories.map((category) => (
        <RatingCategory
          key={category.key}
          category={category.key}
          label={category.label}
          value={userRatings?.[category.key] || 0}
          onChange={(value) => handleRatingChange(category.key, value)}
          readonly={readonly}
        />
      ))}
    </div>
  );
}
```

### Custom Hook Extraction

```typescript
// Create app/hooks/usePerfumeRating.ts
export function usePerfumeRating(perfumeId: string, userId: string | null) {
  const [ratings, setRatings] = useState<UserRatings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetcher = useFetcher();

  const handleRatingChange = useCallback(
    (category: string, value: number) => {
      if (!userId) return;

      setRatings((prev) => ({ ...prev, [category]: value }));

      fetcher.submit(
        { userId, perfumeId, category, rating: value.toString() },
        { method: "POST", action: "/api/ratings" }
      );
    },
    [userId, perfumeId, fetcher]
  );

  const handleError = useCallback(() => {
    setError("Failed to submit rating");
    // Revert optimistic update
    setRatings(ratings);
  }, [ratings]);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.error) {
      handleError();
    }
  }, [fetcher.state, fetcher.data, handleError]);

  return {
    ratings,
    loading,
    error,
    handleRatingChange,
    refetch: () => setRatings(null),
  };
}
```

## 3. Error Handling Standardization

### Centralized Error Handling

```typescript
// Create app/utils/error-handler.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, "VALIDATION_ERROR", 400, { field });
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(`${resource} not found`, "NOT_FOUND", 404, { resource, id });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
  }
}

// Create app/utils/error-response.ts
export function createErrorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        code: error.code,
        context: error.context,
      }),
      {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  console.error("Unexpected error:", error);
  return new Response(
    JSON.stringify({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

### Error Boundary Component

```typescript
// Create app/components/atoms/ErrorBoundary/ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  PropsWithChildren,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    // Send to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>We're sorry, but something unexpected happened.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 4. Type Safety Improvements

### Strict Type Definitions

```typescript
// Create app/types/api.ts
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Create app/types/perfume.ts
export interface Perfume {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  perfumeHouseId: string | null;
  createdAt: Date;
  updatedAt: Date;
  perfumeHouse?: PerfumeHouse;
  userRatings?: UserPerfumeRating[];
  averageRatings?: AverageRatings;
}

export interface PerfumeFilters {
  houseType?: HouseType;
  search?: string;
  sortBy?: "name" | "createdAt" | "rating";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Create app/types/user.ts
export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeUser extends Omit<User, "email"> {
  email: string; // Keep email but ensure it's safe
}
```

### Generic Utility Types

```typescript
// Create app/types/utils.ts
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Usage examples
type CreatePerfumeRequest = Optional<Perfume, "id" | "createdAt" | "updatedAt">;
type UpdatePerfumeRequest = DeepPartial<
  Pick<Perfume, "name" | "description" | "image">
>;
```

## 5. Performance Optimizations

### Memoization and Callback Optimization

```typescript
// Create app/utils/performance.ts
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
```

### Component Optimization

```typescript
// Create app/components/atoms/OptimizedImage/OptimizedImage.tsx
import { memo, useState, useCallback } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export const OptimizedImage = memo<OptimizedImageProps>(
  ({ src, alt, width, height, className, priority = false }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    const handleLoad = useCallback(() => {
      setLoaded(true);
    }, []);

    const handleError = useCallback(() => {
      setError(true);
    }, []);

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
);

OptimizedImage.displayName = "OptimizedImage";
```

## 6. Code Duplication Elimination

### Shared Utilities

```typescript
// Create app/utils/validation.ts
export const validationSchemas = {
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) || "Invalid email address";
  },

  password: (value: string) => {
    if (value.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(value)) return "Password must contain uppercase letter";
    if (!/[a-z]/.test(value)) return "Password must contain lowercase letter";
    if (!/\d/.test(value)) return "Password must contain number";
    return true;
  },

  required: (value: any) => {
    return (value && value.toString().trim()) || "This field is required";
  },
};

// Create app/utils/formatting.ts
export const formatters = {
  currency: (amount: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  },

  date: (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      ...options,
    }).format(dateObj);
  },

  truncate: (text: string, length: number) => {
    return text.length > length ? `${text.slice(0, length)}...` : text;
  },
};
```

### Shared Components

```typescript
// Create app/components/atoms/LoadingSpinner/LoadingSpinner.tsx
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={`animate-spin ${sizeClasses[size]} ${className}`}>
      <div className="w-full h-full border-2 border-gray-300 border-t-noir-gold rounded-full" />
    </div>
  );
}

// Create app/components/atoms/ErrorMessage/ErrorMessage.tsx
interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({
  message,
  onRetry,
  className = "",
}: ErrorMessageProps) {
  return (
    <div
      className={`bg-red-900/20 border border-red-500/50 rounded p-4 ${className}`}
    >
      <div className="flex items-center">
        <span className="text-red-400 mr-2">⚠️</span>
        <span className="text-red-300">{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-auto text-red-400 hover:text-red-300 underline"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
```

## 7. Database Query Optimization

### Query Builder Pattern

```typescript
// Create app/utils/database/query-builder.ts
export class PerfumeQueryBuilder {
  private query: any = {};

  constructor(private prisma: PrismaClient) {}

  withHouse() {
    this.query.include = {
      ...this.query.include,
      perfumeHouse: {
        select: {
          id: true,
          name: true,
          type: true,
          country: true,
        },
      },
    };
    return this;
  }

  withRatings() {
    this.query.include = {
      ...this.query.include,
      userPerfumeRating: {
        select: {
          id: true,
          longevity: true,
          sillage: true,
          gender: true,
          priceValue: true,
          overall: true,
        },
      },
    };
    return this;
  }

  filterByHouseType(houseType: HouseType) {
    this.query.where = {
      ...this.query.where,
      perfumeHouse: {
        type: houseType,
      },
    };
    return this;
  }

  searchByName(searchTerm: string) {
    this.query.where = {
      ...this.query.where,
      name: {
        contains: searchTerm,
        mode: "insensitive",
      },
    };
    return this;
  }

  paginate(page: number, limit: number) {
    this.query.skip = (page - 1) * limit;
    this.query.take = limit;
    return this;
  }

  orderBy(field: string, direction: "asc" | "desc" = "asc") {
    this.query.orderBy = {
      [field]: direction,
    };
    return this;
  }

  async execute() {
    return this.prisma.perfume.findMany(this.query);
  }
}

// Usage
const perfumes = await new PerfumeQueryBuilder(prisma)
  .withHouse()
  .withRatings()
  .filterByHouseType("indie")
  .searchByName("rose")
  .paginate(1, 20)
  .orderBy("createdAt", "desc")
  .execute();
```

## 8. Configuration Management

### Environment Configuration

```typescript
// Create app/config/environment.ts
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  SESSION_SECRET: z.string().min(32),
  REDIS_URL: z.string().url().optional(),
  OPENAI_API_KEY: z.string().optional(),
  PORT: z.string().transform(Number).default("2112"),
  CORS_ORIGIN: z.string().default("http://localhost:2112"),
});

export const env = envSchema.parse(process.env);

// Create app/config/database.ts
export const databaseConfig = {
  connectionLimit: env.NODE_ENV === "production" ? 20 : 5,
  queryTimeout: 30000,
  logLevel: env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
};

// Create app/config/cache.ts
export const cacheConfig = {
  defaultTTL: 3600, // 1 hour
  maxSize: 1000,
  compression: true,
};
```

## 9. Documentation Standards

### Component Documentation

```typescript
// Create app/components/atoms/Button/Button.stories.ts
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Atoms/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["primary", "secondary", "danger"],
    },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Button",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Button",
  },
};
```

### API Documentation

```typescript
// Create app/routes/api/perfumes.tsx
/**
 * @route GET /api/perfumes
 * @description Get paginated list of perfumes with optional filtering
 * @query {string} [houseType] - Filter by house type (indie, designer, niche, etc.)
 * @query {string} [search] - Search by perfume name
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=20] - Number of items per page
 * @query {string} [sortBy=createdAt] - Sort field (name, createdAt, rating)
 * @query {string} [sortOrder=desc] - Sort direction (asc, desc)
 * @returns {PaginatedResponse<Perfume>} Paginated list of perfumes
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Implementation
}
```

## 10. Testing Improvements

### Test Utilities

```typescript
// Create test/utils/test-helpers.ts
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-123",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    username: "testuser",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockPerfume(overrides: Partial<Perfume> = {}): Perfume {
  return {
    id: "perfume-123",
    name: "Test Perfume",
    description: "A test perfume",
    image: null,
    perfumeHouseId: "house-123",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function renderWithProviders(ui: React.ReactElement, options = {}) {
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryProvider>
        <SessionProvider>{children}</SessionProvider>
      </QueryProvider>
    ),
    ...options,
  });
}
```

## Implementation Priority

### Phase 1 (Week 1-2): Foundation

1. Standardize file structure and naming
2. Implement centralized error handling
3. Add comprehensive type definitions
4. Create shared utilities

### Phase 2 (Week 3-4): Component Refactoring

1. Break down large components
2. Extract custom hooks
3. Implement performance optimizations
4. Add shared components

### Phase 3 (Week 5-6): Database and API

1. Implement query builder pattern
2. Standardize API responses
3. Add comprehensive validation
4. Optimize database queries

### Phase 4 (Week 7-8): Documentation and Testing

1. Add comprehensive documentation
2. Improve test coverage
3. Add Storybook stories
4. Create development guidelines

## Success Metrics

### Code Quality

- ESLint errors: 0
- TypeScript errors: 0
- Test coverage: > 90%
- Component complexity: < 15

### Performance

- Bundle size reduction: > 20%
- Component render time: < 16ms
- Database query time: < 100ms
- Memory usage: < 100MB

### Maintainability

- Cyclomatic complexity: < 10
- Code duplication: < 5%
- Documentation coverage: > 80%
- Developer onboarding time: < 2 days
