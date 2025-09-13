# Testing Strategy for Voodoo Perfumes

## Current Testing State

### Existing Infrastructure

- ✅ Vitest configured with React Testing Library
- ✅ Basic test setup with `test/setup-test-env.ts`
- ✅ Component tests for basic components
- ✅ Coverage configuration in place

### Gaps Identified

- ❌ No integration tests for API endpoints
- ❌ No end-to-end testing framework
- ❌ Limited test coverage (estimated < 20%)
- ❌ No performance testing
- ❌ No security testing
- ❌ No database testing utilities

## Testing Pyramid Strategy

### 1. Unit Tests (70% of tests)

**Focus**: Individual functions, components, and utilities

#### Component Testing

```typescript
// Create test/components/PerfumeRatingSystem.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PerfumeRatingSystem } from "~/components/Containers/Perfume/PerfumeRatingSystem";

describe("PerfumeRatingSystem", () => {
  const mockProps = {
    perfumeId: "perfume-123",
    userId: "user-456",
    userRatings: null,
    averageRatings: null,
    readonly: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders rating categories correctly", () => {
    render(<PerfumeRatingSystem {...mockProps} />);

    expect(screen.getByText("Longevity")).toBeInTheDocument();
    expect(screen.getByText("Sillage")).toBeInTheDocument();
    expect(screen.getByText("Gender Appeal")).toBeInTheDocument();
    expect(screen.getByText("Price Value")).toBeInTheDocument();
    expect(screen.getByText("Overall Rating")).toBeInTheDocument();
  });

  it("handles rating changes for logged in users", async () => {
    const mockSubmit = vi.fn();
    vi.mock("@remix-run/react", () => ({
      useFetcher: () => ({
        submit: mockSubmit,
        state: "idle",
        data: null,
      }),
    }));

    render(<PerfumeRatingSystem {...mockProps} />);

    const longevityStar = screen.getByTestId("longevity-star-4");
    fireEvent.click(longevityStar);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          action: "/api/ratings",
        }),
        expect.any(Object)
      );
    });
  });

  it("shows read-only mode for non-logged in users", () => {
    render(
      <PerfumeRatingSystem {...mockProps} userId={null} readonly={true} />
    );

    const stars = screen.getAllByTestId(/star-\d+/);
    stars.forEach((star) => {
      expect(star).toHaveAttribute("data-readonly", "true");
    });
  });
});
```

#### Utility Function Testing

```typescript
// Create test/utils/validation.test.ts
import { describe, it, expect } from "vitest";
import { validatePasswordStrength } from "~/utils/security/password.server";

describe("Password Validation", () => {
  it("should accept strong passwords", () => {
    const result = validatePasswordStrength("StrongP@ssw0rd!");
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject weak passwords", () => {
    const result = validatePasswordStrength("123");
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Password must be at least 8 characters long"
    );
  });

  it("should require special characters", () => {
    const result = validatePasswordStrength("Password123");
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Password must contain at least one special character"
    );
  });
});
```

#### Hook Testing

```typescript
// Create test/hooks/useSmartCache.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSmartCache } from "~/hooks/useSmartCache";

// Mock the cache manager
vi.mock("~/utils/cache/redis.server", () => ({
  CacheManager: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

describe("useSmartCache", () => {
  const mockFetcher = vi.fn();
  const mockCacheGet = vi.mocked(CacheManager.get);
  const mockCacheSet = vi.mocked(CacheManager.set);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return cached data when available", async () => {
    const cachedData = { id: 1, name: "Test" };
    mockCacheGet.mockResolvedValue(cachedData);

    const { result } = renderHook(() => useSmartCache("test-key", mockFetcher));

    await waitFor(() => {
      expect(result.current.data).toEqual(cachedData);
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetcher).not.toHaveBeenCalled();
  });

  it("should fetch fresh data when cache is empty", async () => {
    const freshData = { id: 2, name: "Fresh" };
    mockCacheGet.mockResolvedValue(null);
    mockFetcher.mockResolvedValue(freshData);

    const { result } = renderHook(() => useSmartCache("test-key", mockFetcher));

    await waitFor(() => {
      expect(result.current.data).toEqual(freshData);
      expect(result.current.loading).toBe(false);
    });

    expect(mockCacheSet).toHaveBeenCalledWith("test-key", freshData, 3600);
  });
});
```

### 2. Integration Tests (20% of tests)

**Focus**: API endpoints, database interactions, and service integrations

#### API Endpoint Testing

```typescript
// Create test/api/perfumes.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestServer } from "~/test/utils/test-server";
import { prisma } from "~/db.server";

describe("Perfumes API", () => {
  let server: any;

  beforeEach(async () => {
    server = await createTestServer();
    // Seed test data
    await prisma.perfume.create({
      data: {
        name: "Test Perfume",
        description: "A test perfume",
        perfumeHouse: {
          create: {
            name: "Test House",
            type: "indie",
          },
        },
      },
    });
  });

  afterEach(async () => {
    await server.close();
    // Clean up test data
    await prisma.perfume.deleteMany();
    await prisma.perfumeHouse.deleteMany();
  });

  it("should return list of perfumes", async () => {
    const response = await server.get("/api/perfumes");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("perfumes");
    expect(response.body.perfumes).toHaveLength(1);
    expect(response.body.perfumes[0]).toMatchObject({
      name: "Test Perfume",
      description: "A test perfume",
    });
  });

  it("should handle pagination", async () => {
    const response = await server.get("/api/perfumes?page=1&limit=10");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("pagination");
    expect(response.body.pagination).toMatchObject({
      page: 1,
      limit: 10,
      total: 1,
    });
  });

  it("should filter by house type", async () => {
    const response = await server.get("/api/perfumes?houseType=indie");

    expect(response.status).toBe(200);
    expect(response.body.perfumes).toHaveLength(1);
  });
});
```

#### Database Testing

```typescript
// Create test/database/perfume.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "~/db.server";
import { getPerfumesWithHouses } from "~/utils/database/query-optimizer";

describe("Perfume Database Operations", () => {
  beforeEach(async () => {
    // Clean up before each test
    await prisma.userPerfumeRating.deleteMany();
    await prisma.perfume.deleteMany();
    await prisma.perfumeHouse.deleteMany();
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.userPerfumeRating.deleteMany();
    await prisma.perfume.deleteMany();
    await prisma.perfumeHouse.deleteMany();
  });

  it("should create perfume with house relationship", async () => {
    const house = await prisma.perfumeHouse.create({
      data: {
        name: "Test House",
        type: "indie",
        country: "France",
      },
    });

    const perfume = await prisma.perfume.create({
      data: {
        name: "Test Perfume",
        description: "A test perfume",
        perfumeHouseId: house.id,
      },
    });

    expect(perfume.perfumeHouseId).toBe(house.id);
  });

  it("should get perfumes with house data efficiently", async () => {
    // Create test data
    const house = await prisma.perfumeHouse.create({
      data: { name: "Test House", type: "indie" },
    });

    await prisma.perfume.createMany({
      data: [
        { name: "Perfume 1", perfumeHouseId: house.id },
        { name: "Perfume 2", perfumeHouseId: house.id },
      ],
    });

    const result = await getPerfumesWithHouses(10, 0);

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty("perfumeHouse");
    expect(result[0].perfumeHouse.name).toBe("Test House");
  });
});
```

### 3. End-to-End Tests (10% of tests)

**Focus**: Complete user workflows and critical paths

#### E2E Testing Setup

```typescript
// Create test/e2e/setup.ts
import { test as base } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const test = base.extend({
  page: async ({ page }, use) => {
    // Set up test user session
    await page.goto("/login");
    await page.fill('[data-testid="email"]', "test@example.com");
    await page.fill('[data-testid="password"]', "testpassword");
    await page.click('[data-testid="login-button"]');
    await page.waitForURL("/admin/profile");

    await use(page);
  },
});

export { expect } from "@playwright/test";
```

#### Critical User Flows

```typescript
// Create test/e2e/perfume-rating.spec.ts
import { test, expect } from "./setup";

test.describe("Perfume Rating Flow", () => {
  test("should allow user to rate a perfume", async ({ page }) => {
    // Navigate to perfume page
    await page.goto("/perfume/test-perfume");

    // Wait for rating system to load
    await page.waitForSelector('[data-testid="rating-system"]');

    // Click on longevity rating
    await page.click('[data-testid="longevity-star-4"]');

    // Verify rating was submitted
    await expect(page.locator('[data-testid="rating-success"]')).toBeVisible();

    // Verify rating is displayed
    await expect(page.locator('[data-testid="longevity-rating"]')).toHaveText(
      "4"
    );
  });

  test("should prevent duplicate ratings", async ({ page }) => {
    await page.goto("/perfume/test-perfume");

    // Submit first rating
    await page.click('[data-testid="longevity-star-4"]');
    await page.waitForSelector('[data-testid="rating-success"]');

    // Try to submit another rating
    await page.click('[data-testid="longevity-star-5"]');

    // Should show update message instead of duplicate error
    await expect(page.locator('[data-testid="rating-updated"]')).toBeVisible();
  });
});
```

## Test Utilities and Helpers

### 1. Test Database Setup

```typescript
// Create test/utils/database.ts
import { PrismaClient } from "@prisma/client";

export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL,
    },
  },
});

export async function seedTestData() {
  const house = await testPrisma.perfumeHouse.create({
    data: {
      name: "Test House",
      type: "indie",
      country: "France",
    },
  });

  const perfume = await testPrisma.perfume.create({
    data: {
      name: "Test Perfume",
      description: "A test perfume",
      perfumeHouseId: house.id,
    },
  });

  return { house, perfume };
}

export async function cleanupTestData() {
  await testPrisma.userPerfumeRating.deleteMany();
  await testPrisma.perfume.deleteMany();
  await testPrisma.perfumeHouse.deleteMany();
  await testPrisma.user.deleteMany();
}
```

### 2. Mock Utilities

```typescript
// Create test/utils/mocks.ts
import { vi } from "vitest";

export const mockCacheManager = {
  get: vi.fn(),
  set: vi.fn(),
  invalidate: vi.fn(),
};

export const mockFetcher = {
  submit: vi.fn(),
  state: "idle",
  data: null,
};

export const mockUser = {
  id: "user-123",
  email: "test@example.com",
  role: "user",
};
```

### 3. Test Server Setup

```typescript
// Create test/utils/test-server.ts
import { createServer } from "http";
import { createRequestHandler } from "@react-router/express";
import express from "express";

export async function createTestServer() {
  const app = express();

  // Add test middleware
  app.use(express.json());

  // Add your routes
  app.all(
    "*",
    createRequestHandler({
      build: await import("../../build/server"),
      mode: "test",
    })
  );

  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const port = server.address().port;
      resolve({
        get: (path: string) => fetch(`http://localhost:${port}${path}`),
        post: (path: string, data: any) =>
          fetch(`http://localhost:${port}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }),
        close: () => server.close(),
      });
    });
  });
}
```

## Performance Testing

### 1. Load Testing

```typescript
// Create test/performance/load.test.ts
import { describe, it, expect } from "vitest";

describe("Performance Tests", () => {
  it("should handle concurrent requests", async () => {
    const requests = Array(10)
      .fill(null)
      .map(() => fetch("/api/perfumes"));

    const responses = await Promise.all(requests);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });

  it("should respond within acceptable time", async () => {
    const start = Date.now();
    const response = await fetch("/api/perfumes");
    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(500); // 500ms threshold
  });
});
```

### 2. Memory Testing

```typescript
// Create test/performance/memory.test.ts
import { describe, it, expect } from "vitest";

describe("Memory Tests", () => {
  it("should not leak memory with large datasets", async () => {
    const initialMemory = process.memoryUsage();

    // Simulate large data processing
    const largeData = Array(10000)
      .fill(null)
      .map((_, i) => ({
        id: i,
        name: `Perfume ${i}`,
        description: "Test description",
      }));

    // Process data
    const processed = largeData.map((item) => ({
      ...item,
      processed: true,
    }));

    // Force garbage collection
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

    // Should not increase by more than 50MB
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
});
```

## Security Testing

### 1. Authentication Testing

```typescript
// Create test/security/auth.test.ts
import { describe, it, expect } from "vitest";

describe("Authentication Security", () => {
  it("should reject invalid JWT tokens", async () => {
    const response = await fetch("/api/protected", {
      headers: {
        Authorization: "Bearer invalid-token",
      },
    });

    expect(response.status).toBe(401);
  });

  it("should enforce rate limiting on login", async () => {
    const loginAttempts = Array(10)
      .fill(null)
      .map(() =>
        fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "test@example.com",
            password: "wrongpassword",
          }),
        })
      );

    const responses = await Promise.all(loginAttempts);
    const rateLimited = responses.filter((r) => r.status === 429);

    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

### 2. Input Validation Testing

```typescript
// Create test/security/validation.test.ts
import { describe, it, expect } from "vitest";

describe("Input Validation Security", () => {
  it("should sanitize XSS attempts", async () => {
    const maliciousInput = '<script>alert("xss")</script>';

    const response = await fetch("/api/perfumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: maliciousInput,
        description: "Test",
      }),
    });

    const data = await response.json();
    expect(data.name).not.toContain("<script>");
  });

  it("should prevent SQL injection", async () => {
    const maliciousQuery = "'; DROP TABLE users; --";

    const response = await fetch(
      `/api/perfumes?search=${encodeURIComponent(maliciousQuery)}`
    );

    // Should not cause database error
    expect(response.status).toBe(200);
  });
});
```

## Test Configuration

### 1. Vitest Configuration

```typescript
// Update vitest.config.ts
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        ...configDefaults.exclude,
        "**/*.test.{js,ts,jsx,tsx}",
        "**/*.spec.{js,ts,jsx,tsx}",
        "**/test/**",
        "**/node_modules/**",
        "**/build/**",
        "**/dist/**",
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./test/setup-test-env.ts"],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
```

### 2. Playwright Configuration

```typescript
// Create playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./test/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:2112",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:2112",
    reuseExistingServer: !process.env.CI,
  },
});
```

## CI/CD Integration

### 1. GitHub Actions Workflow

```yaml
# Create .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "npm"

      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "npm"

      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "npm"

      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e
```

### 2. Test Scripts

```json
// Update package.json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --reporter=verbose",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

## Test Data Management

### 1. Test Fixtures

```typescript
// Create test/fixtures/perfumes.ts
export const testPerfumes = [
  {
    name: "Test Perfume 1",
    description: "A test perfume",
    perfumeHouse: {
      name: "Test House 1",
      type: "indie",
      country: "France",
    },
  },
  {
    name: "Test Perfume 2",
    description: "Another test perfume",
    perfumeHouse: {
      name: "Test House 2",
      type: "designer",
      country: "Italy",
    },
  },
];

export const testUsers = [
  {
    email: "test@example.com",
    password: "testpassword123",
    firstName: "Test",
    lastName: "User",
  },
];
```

### 2. Test Database Seeding

```typescript
// Create test/utils/seed.ts
import { testPrisma } from "./database";
import { testPerfumes, testUsers } from "../fixtures/perfumes";

export async function seedTestDatabase() {
  // Create test houses
  const houses = await Promise.all(
    testPerfumes.map((perfume) =>
      testPrisma.perfumeHouse.create({
        data: perfume.perfumeHouse,
      })
    )
  );

  // Create test perfumes
  await Promise.all(
    testPerfumes.map((perfume, index) =>
      testPrisma.perfume.create({
        data: {
          name: perfume.name,
          description: perfume.description,
          perfumeHouseId: houses[index].id,
        },
      })
    )
  );

  // Create test users
  await Promise.all(
    testUsers.map((user) =>
      testPrisma.user.create({
        data: user,
      })
    )
  );
}
```

## Monitoring and Reporting

### 1. Test Results Dashboard

```typescript
// Create test/utils/reporter.ts
export class TestReporter {
  static generateReport(results: any) {
    return {
      summary: {
        total: results.numTotalTests,
        passed: results.numPassedTests,
        failed: results.numFailedTests,
        skipped: results.numTodoTests,
      },
      coverage: results.coverageMap?.getCoverageSummary(),
      performance: results.performanceMetrics,
      timestamp: new Date().toISOString(),
    };
  }
}
```

### 2. Test Metrics Collection

```typescript
// Create test/utils/metrics.ts
export class TestMetrics {
  static collectPerformanceMetrics(testName: string, duration: number) {
    // Send to monitoring service
    console.log(`Test ${testName} took ${duration}ms`);
  }

  static collectCoverageMetrics(coverage: any) {
    // Track coverage trends
    console.log(`Coverage: ${coverage.lines.pct}%`);
  }
}
```

## Implementation Timeline

### Week 1-2: Foundation

- Set up comprehensive test utilities
- Implement unit tests for core components
- Add database testing setup

### Week 3-4: Integration

- Add API endpoint tests
- Implement integration test suite
- Set up test data management

### Week 5-6: E2E and Performance

- Add Playwright E2E tests
- Implement performance testing
- Add security testing

### Week 7-8: CI/CD and Monitoring

- Set up GitHub Actions
- Add test reporting and metrics
- Implement test monitoring

## Success Metrics

### Coverage Targets

- **Unit Tests**: 90%+ coverage
- **Integration Tests**: 80%+ coverage
- **E2E Tests**: 100% critical path coverage

### Performance Targets

- **Test Execution Time**: < 5 minutes for full suite
- **Test Reliability**: > 99% pass rate
- **Test Maintenance**: < 2 hours per week

### Quality Targets

- **Bug Detection**: 95% of bugs caught in testing
- **Regression Prevention**: 100% of critical features protected
- **Code Confidence**: 90%+ developer confidence in changes
