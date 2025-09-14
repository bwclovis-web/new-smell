# Testing Strategy

This document outlines the comprehensive testing strategy for the new-smell application using Vitest.

## Test Configuration Overview

The project uses multiple Vitest configurations to support different types of testing:

### 1. Main Configuration (`vitest.config.ts`)

- **Purpose**: Default configuration for general testing
- **Features**:
  - Happy DOM environment
  - Comprehensive coverage reporting
  - Parallel test execution
  - Type checking enabled
  - Retry mechanism for flaky tests

### 2. Unit Test Configuration (`vitest.config.unit.ts`)

- **Purpose**: Fast, isolated component and utility testing
- **Features**:
  - Optimized for speed (8 max threads)
  - High coverage thresholds (90% for atoms)
  - Minimal mocking
  - Focus on components, utils, and hooks

### 3. Integration Test Configuration (`vitest.config.integration.ts`)

- **Purpose**: Testing component interactions and data flow
- **Features**:
  - Single-threaded execution
  - Database mocking
  - API mocking
  - Longer timeouts (30s)
  - Focus on routes, models, and providers

### 4. Performance Test Configuration (`vitest.config.performance.ts`)

- **Purpose**: Performance benchmarking and optimization
- **Features**:
  - Single-threaded execution
  - Performance API mocking
  - Memory measurement
  - Benchmark reporting
  - No coverage (focused on performance)

### 5. Workspace Configuration (`vitest.config.workspace.ts`)

- **Purpose**: Run all test types together
- **Features**:
  - Combines all test configurations
  - Comprehensive reporting
  - Workspace-level coverage

## Test Structure

```
test/
├── setup-test-env.ts          # Global test environment setup
├── setup-integration.ts       # Integration test specific setup
├── setup-performance.ts       # Performance test specific setup
├── utils/
│   └── test-utils.tsx         # Custom test utilities and helpers
├── performance/
│   └── component-rendering.perf.tsx  # Performance tests
└── integration/               # Integration tests (to be created)
```

## Test Utilities

The project includes comprehensive test utilities organized into specialized modules:

### Core Test Utilities (`test/utils/test-utils.tsx`)

```typescript
import {
  renderWithProviders,
  createMockUser,
  createMockPerfume,
  testComponentWithProps,
  testLoadingStates,
  testErrorStates,
} from "../test/utils/test-utils";

// Renders component with all necessary providers
const { queryClient } = renderWithProviders(<MyComponent />);

// Test component with different props
await testComponentWithProps(MyComponent, propVariations, testFn);

// Test different component states
await testLoadingStates(MyComponent);
await testErrorStates(MyComponent);
```

### Router Testing Utilities (`test/utils/router-test-utils.tsx`)

```typescript
import {
  renderWithRouter,
  testNavigation,
  testRouteParams,
  testRouteGuards,
} from "../test/utils/test-utils";

// Test navigation between routes
await testNavigation(MyComponent, navigationSteps);

// Test route parameters and guards
await testRouteParams(MyComponent, routeTests);
await testRouteGuards(MyComponent, guardTests);
```

### Form Testing Utilities (`test/utils/form-test-utils.tsx`)

```typescript
import {
  fillFormField,
  submitForm,
  testFormValidation,
  testFormSuccess,
  createTestFile,
} from "../test/utils/test-utils";

// Test form interactions
await fillFormField("Email", "test@example.com");
await submitForm("Login");

// Test form validation
await testFormValidation(formFields, submitButtonText);

// Test file uploads
const file = createTestFile("test.jpg", "image/jpeg");
await testFileUpload("Upload", file, "test.jpg");
```

### API Testing Utilities (`test/utils/api-test-utils.ts`)

```typescript
import {
  mockFetchResponse,
  mockFetchError,
  testAPICall,
  testAPIAuthentication,
  testAPIPagination,
} from "../test/utils/test-utils";

// Mock API responses
global.fetch = mockFetchResponse({ data: "success" });

// Test API calls with different scenarios
await testAPICall(apiFunction, scenarios);

// Test API authentication and pagination
await testAPIAuthentication(apiFunction, authScenarios);
await testAPIPagination(apiFunction, totalItems, pageSize);
```

### Authentication Testing Utilities (`test/utils/auth-test-utils.tsx`)

```typescript
import {
  testLoginFlow,
  testLogoutFlow,
  testRoleBasedAccess,
  testPermissionBasedFeatures,
  mockAuthContext,
} from "../test/utils/test-utils";

// Test authentication flows
await testLoginFlow(LoginComponent, credentials);
await testLogoutFlow(LogoutComponent);

// Test role and permission-based access
await testRoleBasedAccess(Component, roleTests);
await testPermissionBasedFeatures(Component, permissionTests);
```

### Accessibility Testing Utilities (`test/utils/accessibility-test-utils.tsx`)

```typescript
import {
  testKeyboardNavigation,
  testARIAAttributes,
  testFormAccessibility,
  runA11yTestSuite,
} from "../test/utils/test-utils";

// Test keyboard navigation
await testKeyboardNavigation(MyComponent);

// Test ARIA attributes and form accessibility
testARIAAttributes(MyComponent, props, expectedARIA);
testFormAccessibility(FormComponent);

// Run comprehensive accessibility test suite
await runA11yTestSuite(MyComponent, props, options);
```

## Coverage Thresholds

### Global Thresholds

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Component-Specific Thresholds

- **Atoms**: 90% (highest quality expected)
- **Molecules**: 85%
- **Organisms**: 80%
- **Utils**: 85%

## Test Scripts

```bash
# Run all tests
npm run test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:performance

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run with UI
npm run test:ui

# Run all test types
npm run test:all
```

## Best Practices

### 1. Test Organization

- Place unit tests next to the components they test
- Use descriptive test names
- Group related tests with `describe` blocks
- Use `it` for individual test cases

### 2. Mocking Strategy

- Mock external dependencies
- Use real implementations for internal utilities when possible
- Reset mocks between tests
- Use `vi.fn()` for function mocks

### 3. Performance Testing

- Test rendering performance
- Monitor memory usage
- Set performance thresholds
- Use `measurePerformance` utility

### 4. Integration Testing

- Test component interactions
- Mock API calls
- Test data flow
- Use real providers when possible

## Environment Setup

### Test Environment Variables

```typescript
NODE_ENV=test
VITEST=true
DATABASE_URL=postgresql://test:test@localhost:5432/test_db
JWT_SECRET=test-jwt-secret-minimum-32-characters-long-for-testing
SESSION_SECRET=test-session-secret-minimum-32-characters-long-for-testing
```

### Global Mocks

- `fetch` API
- `localStorage` and `sessionStorage`
- `IntersectionObserver` and `ResizeObserver`
- `matchMedia`
- `scrollTo`

## Continuous Integration

### Test Results

- JSON reports: `./test-results/*.json`
- JUnit reports: `./test-results/junit.xml`
- HTML coverage: `./coverage/*/index.html`

### Coverage Reports

- Text summary in console
- HTML report in `./coverage/`
- LCOV format for CI integration

## Debugging Tests

### 1. Debug Mode

```bash
# Run specific test in debug mode
npm run test -- --reporter=verbose --no-coverage MyComponent.test.tsx
```

### 2. Test UI

```bash
# Open Vitest UI for interactive testing
npm run test:ui
```

### 3. Watch Mode

```bash
# Run tests in watch mode for development
npm run test:watch
```

## Performance Monitoring

### Memory Usage

```typescript
const memory = global.measureMemory();
console.log(`Memory usage: ${memory.used} / ${memory.total}`);
```

### Rendering Performance

```typescript
const renderTime = global.measurePerformance("Component render", () => {
  render(<MyComponent />);
});
expect(renderTime).toBeLessThan(10); // 10ms threshold
```

## Troubleshooting

### Common Issues

1. **Tests timing out**: Increase `testTimeout` in configuration
2. **Memory leaks**: Check for proper cleanup in `afterEach` hooks
3. **Flaky tests**: Use retry mechanism or investigate race conditions
4. **Mock issues**: Ensure mocks are reset between tests

### Debug Commands

```bash
# Run with verbose output
npm run test -- --reporter=verbose

# Run specific test file
npm run test -- MyComponent.test.tsx

# Run tests matching pattern
npm run test -- --grep "renders correctly"
```

## Future Enhancements

1. **E2E Testing**: Add Playwright or Cypress for end-to-end tests
2. **Visual Regression**: Add visual testing with Chromatic or Percy
3. **Accessibility Testing**: Add axe-core for accessibility testing
4. **Load Testing**: Add load testing for API endpoints
5. **Mutation Testing**: Add mutation testing for test quality validation
