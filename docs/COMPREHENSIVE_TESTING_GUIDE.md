# Comprehensive Testing Guide

This guide provides a complete overview of the testing strategy, setup, and best practices for the new-smell application.

## Table of Contents

1. [Testing Strategy Overview](#testing-strategy-overview)
2. [Test Types and Configuration](#test-types-and-configuration)
3. [Running Tests](#running-tests)
4. [Test Coverage](#test-coverage)
5. [CI/CD Integration](#cicd-integration)
6. [Test Monitoring and Alerting](#test-monitoring-and-alerting)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Testing Strategy Overview

Our testing strategy follows a pyramid approach with multiple layers:

```
    E2E Tests (Few, High Value)
         /              \
    Integration Tests (Some, Medium Value)
         /              \
    Unit Tests (Many, Fast, Low Value)
```

### Test Types

1. **Unit Tests** - Fast, isolated component and utility testing
2. **Integration Tests** - Component interactions and data flow
3. **E2E Tests** - Complete user workflows across browsers
4. **Performance Tests** - Performance benchmarking and optimization
5. **Security Tests** - Vulnerability scanning and security audits

## Test Types and Configuration

### Unit Tests

**Purpose**: Test individual components, utilities, and hooks in isolation.

**Configuration**: `vitest.config.unit.ts`

**Coverage Thresholds**:

- Lines: 90%
- Functions: 90%
- Branches: 85%
- Statements: 90%

**Key Features**:

- Fast execution (5s timeout)
- High coverage requirements
- Minimal mocking
- Parallel execution

**Example**:

```typescript
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/utils/test-utils";
import Button from "./Button";

describe("Button", () => {
  it("renders with correct text", () => {
    renderWithProviders(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });
});
```

### Integration Tests

**Purpose**: Test component interactions, API calls, and data flow.

**Configuration**: `vitest.config.integration.ts`

**Coverage Thresholds**:

- Lines: 80%
- Functions: 80%
- Branches: 75%
- Statements: 80%

**Key Features**:

- Single-threaded execution
- Database mocking
- API mocking
- Longer timeouts (30s)

**Example**:

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/utils/test-utils";
import PerfumeList from "./PerfumeList";

describe("PerfumeList", () => {
  it("loads and displays perfumes", async () => {
    renderWithProviders(<PerfumeList />);

    await waitFor(() => {
      expect(screen.getByText("Test Perfume")).toBeInTheDocument();
    });
  });
});
```

### E2E Tests

**Purpose**: Test complete user workflows across multiple browsers.

**Configuration**: `playwright.config.ts` / `playwright.config.ci.ts`

**Key Features**:

- Multi-browser testing
- Mobile device testing
- Screenshot capture on failure
- Video recording
- Trace collection

**Example**:

```typescript
import { test, expect } from "@playwright/test";

test("user can browse perfumes", async ({ page }) => {
  await page.goto("/");
  await page.click("text=The Vault");
  await expect(page.locator("h1")).toContainText("The Vault");
  await page.click('[data-testid="perfume-card"]');
  await expect(page.locator("h1")).toContainText("Perfume Details");
});
```

### Performance Tests

**Purpose**: Benchmark performance and detect regressions.

**Configuration**: `vitest.config.performance.ts`

**Key Features**:

- Memory usage monitoring
- Render time measurement
- Bundle size analysis
- API response time testing

**Example**:

```typescript
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import PerfumeList from "./PerfumeList";

describe("Performance Tests", () => {
  it("renders large list efficiently", () => {
    const start = performance.now();
    render(<PerfumeList items={largeItemList} />);
    const end = performance.now();

    expect(end - start).toBeLessThan(100); // 100ms threshold
  });
});
```

## Running Tests

### Local Development

```bash
# Run all tests
npm run test:all

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:performance

# Run with coverage
npm run test:coverage:all

# Run in watch mode
npm run test:watch

# Run with UI
npm run test:ui
```

### CI/CD Pipeline

```bash
# Full test suite
npm run test:full

# Security and quality checks
npm run test:security
npm run test:quality

# E2E tests for CI
npm run test:e2e:ci
```

### Debugging

```bash
# Debug tests
npm run test:debug

# Fix failing tests
npm run test:fix

# Update snapshots
npm run test:update-snapshots
```

## Test Coverage

### Coverage Reports

Coverage reports are generated in multiple formats:

- **HTML**: Interactive coverage report in `coverage/index.html`
- **JSON**: Machine-readable format for CI/CD
- **LCOV**: Standard format for external tools
- **JUnit**: XML format for CI systems

### Coverage Thresholds

| Component Type | Lines | Functions | Branches | Statements |
| -------------- | ----- | --------- | -------- | ---------- |
| Atoms          | 90%   | 90%       | 85%      | 90%        |
| Molecules      | 85%   | 85%       | 80%      | 85%        |
| Organisms      | 80%   | 80%       | 75%      | 80%        |
| Utils          | 85%   | 85%       | 80%      | 85%        |

### Coverage Commands

```bash
# Unit test coverage
npm run test:coverage:unit

# Integration test coverage
npm run test:coverage:integration

# All coverage
npm run test:coverage:all
```

## CI/CD Integration

### GitHub Actions Workflow

The CI/CD pipeline includes:

1. **Unit Tests** - Fast component testing
2. **Integration Tests** - Database and API testing
3. **Performance Tests** - Performance benchmarking
4. **E2E Tests** - Cross-browser testing
5. **Security Tests** - Vulnerability scanning
6. **Code Quality** - Linting and type checking

### Workflow Triggers

- **Push** to main/develop branches
- **Pull Requests** to main/develop branches
- **Scheduled** daily at 2 AM UTC
- **Manual** trigger available

### Artifacts

The pipeline generates:

- Test results (JSON, JUnit)
- Coverage reports (HTML, LCOV)
- Screenshots and videos (E2E failures)
- Performance metrics
- Security audit results

## Test Monitoring and Alerting

### Test Monitor

The test monitoring system provides:

- **Real-time monitoring** of test results
- **Coverage tracking** and threshold enforcement
- **Performance regression** detection
- **Automated alerting** for failures
- **Trend analysis** and reporting

### Alerting Channels

- **Slack** - Real-time notifications
- **Email** - Detailed failure reports
- **GitHub** - PR comments and status updates

### Monitoring Commands

```bash
# Run test monitor
npm run test:monitor

# Clean test artifacts
npm run test:clean
```

## Best Practices

### Writing Tests

1. **Follow AAA Pattern**:

   ```typescript
   // Arrange
   const props = { title: "Test Title" };

   // Act
   render(<Component {...props} />);

   // Assert
   expect(screen.getByText("Test Title")).toBeInTheDocument();
   ```

2. **Use Descriptive Test Names**:

   ```typescript
   // Good
   it("should display error message when API call fails");

   // Bad
   it("should work");
   ```

3. **Test Behavior, Not Implementation**:

   ```typescript
   // Good - tests user behavior
   expect(screen.getByRole("button")).toBeEnabled();

   // Bad - tests implementation details
   expect(component.state.isLoading).toBe(false);
   ```

4. **Use Test Utilities**:

   ```typescript
   import { renderWithProviders } from "../../test/utils/test-utils";

   // Provides router context, query client, etc.
   renderWithProviders(<Component />);
   ```

### Test Organization

```
test/
├── e2e/                    # E2E tests
│   ├── pages/             # Page Object Models
│   ├── utils/             # E2E utilities
│   └── fixtures/          # Test data
├── performance/           # Performance tests
├── utils/                 # Test utilities
│   ├── test-utils.tsx     # Core utilities
│   ├── api-test-utils.ts  # API testing
│   └── auth-test-utils.tsx # Auth testing
└── validation/            # Validation tests
```

### Mocking Strategy

1. **Mock External Dependencies**:

   ```typescript
   vi.mock("~/api/perfumes", () => ({
     getPerfumes: vi.fn().mockResolvedValue(mockPerfumes),
   }));
   ```

2. **Use Test Data Factories**:

   ```typescript
   const createMockPerfume = (overrides = {}) => ({
     id: "1",
     name: "Test Perfume",
     ...overrides,
   });
   ```

3. **Mock Browser APIs**:
   ```typescript
   Object.defineProperty(window, "localStorage", {
     value: mockLocalStorage,
   });
   ```

## Troubleshooting

### Common Issues

1. **Tests Running Multiple Times**:

   - Check for duplicate test files
   - Ensure proper test isolation
   - Use `beforeEach` and `afterEach` for cleanup

2. **Router Context Errors**:

   - Use `renderWithProviders` instead of `render`
   - Ensure proper router setup in test utilities

3. **Async Test Failures**:

   - Use `waitFor` for async operations
   - Increase timeout if needed
   - Check for proper cleanup

4. **Coverage Issues**:
   - Check coverage thresholds
   - Ensure all code paths are tested
   - Use coverage reports to identify gaps

### Debug Commands

```bash
# Debug specific test
npm run test:debug -- --grep="test name"

# Run with verbose output
npm run test:run -- --reporter=verbose

# Update snapshots
npm run test:update-snapshots

# Clean and reinstall
npm run test:clean
npm install
```

### Getting Help

1. Check the test output for specific error messages
2. Review the coverage reports for untested code
3. Use the test UI for interactive debugging
4. Consult the test utilities documentation
5. Check the CI/CD logs for environment-specific issues

## Conclusion

This comprehensive testing setup ensures:

- **High code quality** through extensive test coverage
- **Reliable deployments** through automated testing
- **Fast feedback** through parallel test execution
- **Early issue detection** through continuous monitoring
- **Maintainable tests** through proper organization and utilities

For questions or issues, please refer to the troubleshooting section or contact the development team.
