# Integration Tests

This directory contains integration tests for the New Smell perfume trading platform.

## Overview

Integration tests verify that different parts of the application work together correctly, including:

- Route loaders and actions
- API endpoints
- Authentication flows
- Database operations
- Multi-component interactions

## Directory Structure

```
test/integration/
├── routes/
│   ├── home.test.tsx           # Home page route tests
│   ├── perfume.test.tsx        # Perfume detail page tests
│   ├── the-vault.test.tsx      # Vault page tests (browse perfumes)
│   ├── api/
│   │   ├── perfumeLoader.test.ts    # Perfume search API tests
│   │   └── wishlist.test.ts         # Wishlist API tests
│   ├── login/
│   │   ├── signup.test.tsx     # User registration tests
│   │   └── signin.test.tsx     # User authentication tests
│   └── admin/
│       └── users.test.ts       # Admin user management tests
└── README.md                   # This file
```

## Running Integration Tests

### Run all integration tests

```bash
npm run test:integration
```

### Run specific test file

```bash
npm run test:integration test/integration/routes/home.test.tsx
```

### Run with coverage

```bash
npm run test:integration -- --coverage
```

### Run in watch mode

```bash
npm run test:integration -- --watch
```

## Test Configuration

Integration tests use a separate Vitest configuration (`vitest.config.integration.ts`) with:

- **Environment**: happy-dom (for DOM simulation)
- **Timeout**: 30s for tests, 20s for hooks
- **Execution**: Single-threaded to avoid race conditions
- **Coverage threshold**: 70% for all metrics
- **Setup files**:
  - `test/setup-test-env.ts` - General test environment setup
  - `test/setup-integration.ts` - Integration-specific setup

## Writing Integration Tests

### Basic Structure

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest"
import type { LoaderFunctionArgs } from "react-router"

import { loader } from "~/routes/your-route"
import * as yourModel from "~/models/your-model.server"

vi.mock("~/models/your-model.server")

describe("Your Route Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Loader", () => {
    it("should load data successfully", async () => {
      // Arrange
      const mockData = { id: "1", name: "Test" }
      vi.mocked(yourModel.getData).mockResolvedValue(mockData)

      const request = new Request("https://example.com/your-route")
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      // Act
      const result = await loader(args)

      // Assert
      expect(result).toEqual(mockData)
      expect(yourModel.getData).toHaveBeenCalled()
    })
  })
})
```

### Testing Loaders

```typescript
describe("Loader", () => {
  it("should load data with authentication", async () => {
    vi.mocked(sessionManager.verifyAccessToken).mockReturnValue({
      userId: "user-123",
    })
    vi.mocked(userServer.getUserById).mockResolvedValue(mockUser)

    const request = new Request("https://example.com/route", {
      headers: {
        cookie: cookie.serialize("accessToken", "valid-token"),
      },
    })

    const args: LoaderFunctionArgs = {
      request,
      params: { id: "123" },
      context: {},
    }

    const result = await loader(args)

    expect(result.user).toEqual(mockUser)
  })
})
```

### Testing Actions

```typescript
describe("Action", () => {
  it("should handle form submission", async () => {
    vi.mocked(yourModel.create).mockResolvedValue(mockCreatedItem)

    const formData = new FormData()
    formData.append("name", "Test Name")
    formData.append("_action", "create")

    const request = new Request("https://example.com/route", {
      method: "POST",
      body: formData,
    })

    const args: ActionFunctionArgs = {
      request,
      params: {},
      context: {},
    }

    const response = await action(args)

    expect(yourModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Test Name" })
    )
  })
})
```

### Testing Error Handling

```typescript
it("should handle database errors gracefully", async () => {
  vi.mocked(yourModel.getData).mockRejectedValue(
    new Error("Database connection failed")
  )

  const request = new Request("https://example.com/route")
  const args: LoaderFunctionArgs = {
    request,
    params: {},
    context: {},
  }

  await expect(loader(args)).rejects.toThrow("Database connection failed")
})
```

### Testing Authorization

```typescript
it("should deny access to unauthorized users", async () => {
  vi.mocked(sessionManager.verifyAccessToken).mockReturnValue(null)

  const request = new Request("https://example.com/admin/route")
  const args: LoaderFunctionArgs = {
    request,
    params: {},
    context: {},
  }

  await expect(loader(args)).rejects.toThrow()
})
```

## Best Practices

1. **Mock External Dependencies**: Always mock database calls, API requests, and external services
2. **Test Happy Paths**: Verify successful operations first
3. **Test Error Cases**: Ensure proper error handling
4. **Test Edge Cases**: Empty data, missing parameters, invalid input
5. **Test Security**: Authentication, authorization, input sanitization
6. **Use beforeEach**: Clear mocks between tests
7. **Descriptive Names**: Use clear, descriptive test names
8. **Arrange-Act-Assert**: Follow the AAA pattern for clarity
9. **Test Data Factories**: Create reusable mock data
10. **Performance**: Test with large datasets when applicable

## Common Patterns

### Authentication Testing

```typescript
const mockAuthRequest = (token: string) =>
  new Request("https://example.com/route", {
    headers: {
      cookie: cookie.serialize("accessToken", token),
    },
  })
```

### Form Data Creation

```typescript
const createFormData = (data: Record<string, string>) => {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value)
  })
  return formData
}
```

### Mock Data Factories

```typescript
const createMockUser = (overrides = {}) => ({
  id: "user-123",
  email: "test@example.com",
  username: "testuser",
  role: "USER" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})
```

## Coverage Goals

- **Routes**: 70%+ coverage
- **API Endpoints**: 70%+ coverage
- **Authentication Flows**: 90%+ coverage
- **Admin Operations**: 80%+ coverage

## Troubleshooting

### Tests Timing Out

Increase timeout in test:

```typescript
it("should handle long operation", async () => {
  // Test code
}, 60000) // 60 second timeout
```

### Mock Not Working

Ensure mock is declared before import:

```typescript
vi.mock("~/models/your-model.server")
import { loader } from "~/routes/your-route"
```

### Database Connection Errors

Check that mocks are properly set up in `test/setup-integration.ts`

## Related Documentation

- [Vitest Integration Config](../../vitest.config.integration.ts)
- [Test Setup](../setup-integration.ts)
- [E2E Tests](../e2e/README.md)
- [Component Tests](../../app/components/README.md)

## Contributing

When adding new routes or modifying existing ones:

1. Add or update integration tests
2. Ensure all test cases pass
3. Maintain or improve coverage
4. Document any new patterns or utilities
5. Follow the established testing conventions

## Questions?

For questions about integration testing, please refer to:

- [Vitest Documentation](https://vitest.dev/)
- [React Router Testing](https://reactrouter.com/en/main/guides/testing)
- Project documentation in `/docs`
