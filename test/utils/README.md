# Test Utilities Documentation

Comprehensive test utilities for the New Smell project. These utilities simplify common testing patterns and promote consistent test writing across the codebase.

## Table of Contents

1. [Main Test Utilities](#main-test-utilities)
2. [Router Testing](#router-testing)
3. [Form Testing](#form-testing)
4. [Authentication Testing](#authentication-testing)
5. [API Testing](#api-testing)
6. [Accessibility Testing](#accessibility-testing)
7. [Viewport Testing](#viewport-testing)
8. [Modal Testing](#modal-testing)
9. [Async Testing](#async-testing)
10. [Data Display Testing](#data-display-testing)

---

## Installation

Import utilities from the central export point:

```typescript
import {
  renderWithProviders,
  testFormValidation,
  mockFetch,
  testAccessibility,
} from 'test/utils'
```

---

## Main Test Utilities

**File:** `test/utils/test-utils.tsx`

### Rendering Utilities

#### `renderWithProviders(component, options)`

Renders a component with all necessary providers (React Query, Router).

```typescript
import { renderWithProviders } from 'test/utils'

test('renders component', () => {
  renderWithProviders(<MyComponent />)
  expect(screen.getByText('Hello')).toBeInTheDocument()
})
```

#### `renderWithMemoryRouter(component, options)`

Renders a component with MemoryRouter.

```typescript
renderWithMemoryRouter(<MyComponent />, {
  initialEntries: ['/perfume/santal-33']
})
```

### Mock Generators

#### `mockFetch(data, status)`

Creates a mock fetch function.

```typescript
global.fetch = mockFetch({ id: 1, name: 'Test' }, 200)
```

#### `mockLocalStorage()` / `mockSessionStorage()`

Mocks browser storage APIs.

```typescript
const storage = mockLocalStorage()
storage.setItem('key', 'value')
expect(storage.getItem('key')).toBe('value')
```

### Browser API Mocks

- `mockIntersectionObserver()`
- `mockResizeObserver()`
- `mockMatchMedia(matches)`
- `mockScrollTo()`

---

## Router Testing

**File:** `test/utils/router-test-utils.tsx`

### `renderWithRouter(ui, options)`

Renders component with router context.

```typescript
const { history } = renderWithRouter(<MyPage />, {
  initialEntries: ['/perfume/123']
})

expect(history.location.pathname).toBe('/perfume/123')
```

### Advanced Router Testing

- `testNavigation(component, steps)` - Test navigation flows
- `testRouteParams(component, params)` - Test route parameters
- `testQueryParams(component, queries)` - Test query strings
- `testRouteGuards(component, guards)` - Test authentication/authorization
- `testRouteLoading(component, tests)` - Test loading states
- `testRouteErrors(component, tests)` - Test error handling

**Example:**

```typescript
await testNavigation(<App />, [
  {
    action: () => user.click(screen.getByText('Profile')),
    expectedPath: '/profile',
    description: 'Navigate to profile'
  }
])
```

---

## Form Testing

**File:** `test/utils/form-test-utils.tsx`

### Form Interactions

#### `fillFormField(label, value)`

Fill a form field by label.

```typescript
await fillFormField('Email', 'test@example.com')
```

#### `submitForm(buttonText)`

Submit a form.

```typescript
await submitForm('Sign Up')
```

### Advanced Form Testing

- `testFormValidation(fields, submitText)` - Test validation rules
- `testFormSuccess(fields, successMessage)` - Test successful submission
- `testFieldTypes(tests)` - Test input types
- `testFormAccessibility()` - Test form accessibility
- `testFileUpload(label, file)` - Test file uploads
- `testDynamicFields(addBtn, removeBtn, label, count)` - Test dynamic fields

**Example:**

```typescript
await testFormValidation([
  {
    label: 'Email',
    value: 'invalid-email',
    expectedError: 'Please enter a valid email'
  },
  {
    label: 'Password',
    value: '123',
    expectedError: 'Password must be at least 8 characters'
  }
])
```

---

## Authentication Testing

**File:** `test/utils/auth-test-utils.tsx`

### Mock Authentication

#### `createMockAuthUser(overrides)`

Create mock user data.

```typescript
const user = createMockAuthUser({
  role: 'admin',
  permissions: ['read', 'write', 'delete']
})
```

#### `mockAuthStates`

Predefined auth states (authenticated, unauthenticated, admin, guest).

### Auth Flow Testing

- `testLoginFlow(Component, credentials)` - Test login
- `testLogoutFlow(Component)` - Test logout
- `testRegistrationFlow(Component, userData)` - Test signup
- `testAuthGuards(Component, tests)` - Test route protection
- `testRoleBasedAccess(Component, tests)` - Test role permissions
- `testPermissionBasedFeatures(Component, tests)` - Test feature access
- `testSessionManagement(Component, tests)` - Test sessions
- `testPasswordRequirements(Component, tests)` - Test password validation
- `test2FA(Component, code)` - Test two-factor authentication

**Example:**

```typescript
await testRoleBasedAccess(<Dashboard />, [
  {
    role: 'admin',
    permissions: ['read', 'write', 'delete'],
    expectedElements: ['Delete User', 'Edit Settings'],
    hiddenElements: [],
    description: 'Admin has full access'
  },
  {
    role: 'user',
    permissions: ['read'],
    expectedElements: ['View Profile'],
    hiddenElements: ['Delete User', 'Edit Settings'],
    description: 'User has read-only access'
  }
])
```

---

## API Testing

**File:** `test/utils/api-test-utils.ts`

### API Mocking

#### `mockFetchResponse(data, status, headers)`

Mock successful API response.

```typescript
global.fetch = mockFetchResponse({ id: 1, name: 'Test' }, 200)
```

#### `mockFetchError(message, status)`

Mock API error.

```typescript
global.fetch = mockFetchError('Network error', 500)
```

#### `mockAPIEndpoints`

Predefined mocks for common endpoints (users, perfumes, houses).

### API Testing Functions

- `testAPICall(apiFunction, scenarios)` - Test API with various scenarios
- `testHTTPMethods(baseUrl, endpoints)` - Test GET, POST, PUT, DELETE, PATCH
- `testAPIAuthentication(apiFunction, scenarios)` - Test API auth
- `testAPIRateLimit(apiFunction, max, window)` - Test rate limiting
- `testAPICaching(apiFunction, key)` - Test response caching
- `testAPIPagination(apiFunction, total, pageSize)` - Test pagination
- `testAPIErrorHandling(apiFunction, scenarios)` - Test error responses

**Example:**

```typescript
await testAPICall(
  () => fetchPerfume('123'),
  [
    {
      name: 'Success',
      mockResponse: mockFetchResponse({ id: '123', name: 'Santal 33' }),
      expectedResult: { id: '123', name: 'Santal 33' }
    },
    {
      name: 'Not Found',
      mockResponse: mockFetchError('Not found', 404),
      shouldThrow: true
    }
  ]
)
```

---

## Accessibility Testing

**File:** `test/utils/accessibility-test-utils.tsx`

### A11y Test Functions

- `testKeyboardNavigation(Component, props)` - Test tab navigation
- `testARIAAttributes(Component, props, expected)` - Test ARIA
- `testSemanticHTML(Component, props, roles)` - Test semantic structure
- `testFormAccessibility(Component, props)` - Test form a11y
- `testColorContrast(Component, props)` - Test color contrast
- `testScreenReaderAnnouncements(Component, props, announcements)` - Test live regions
- `testFocusManagement(Component, props, tests)` - Test focus handling
- `testSkipLinks(Component, props)` - Test skip navigation
- `testHeadingsHierarchy(Component, props)` - Test heading structure
- `testLandmarkRegions(Component, props, landmarks)` - Test landmarks
- `testImageAltText(Component, props)` - Test image accessibility
- `testButtonAccessibility(Component, props)` - Test button a11y
- `testLinkAccessibility(Component, props)` - Test link a11y
- `testTableAccessibility(Component, props)` - Test table a11y
- `testMotionAccessibility(Component, props)` - Test prefers-reduced-motion

### Comprehensive Test Suite

```typescript
await runA11yTestSuite(<MyComponent />, {}, {
  testKeyboard: true,
  testScreenReader: true,
  testFocus: true,
  testSemantics: true,
  testForms: true,
})
```

---

## Viewport Testing

**File:** `test/utils/viewport-test-utils.ts`

### Viewport Presets

```typescript
viewportPresets = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
  // ... more presets
}
```

### Viewport Functions

#### `setViewport(width, height)`

Set viewport dimensions.

```typescript
setViewport(375, 667) // Mobile
```

#### `setViewportByName(name)`

Set viewport by preset name.

```typescript
setViewportByName('tablet')
```

#### `testAtViewports(testFn, viewports)`

Test component at multiple viewports.

```typescript
await testAtViewports(
  (viewport) => {
    renderWithProviders(<MyComponent />)
    // Assertions based on viewport
  },
  ['mobile', 'tablet', 'desktop']
)
```

### Additional Functions

- `mockMediaQuery(query, matches)` - Mock media queries
- `mockTouchSupport(enabled)` - Mock touch capabilities
- `testResponsiveBehavior(Component, tests)` - Test responsive UI
- `testOrientationChange(Component, testFn)` - Test orientation
- `mockDevicePixelRatio(ratio)` - Mock pixel density

---

## Modal Testing

**File:** `test/utils/modal-test-utils.tsx`

### Modal Functions

- `testModalOpen(trigger, expectedContent)` - Test opening
- `testModalClose(method)` - Test closing (button, overlay, escape)
- `testModalFocusTrap(selector)` - Test focus trap
- `testModalBackdrop()` - Test backdrop
- `testModalAnimations(type)` - Test animations
- `testModalAccessibility()` - Test modal a11y
- `testModalForm(data, submitBtn)` - Test form in modal
- `testModalStacking(count)` - Test multiple modals
- `testConfirmationModal(action, message, confirm)` - Test confirmation
- `testModalScrollLock()` - Test body scroll lock
- `testModalPortal()` - Test portal rendering
- `testModalSizes(Component, sizes)` - Test size variants

**Example:**

```typescript
// Test opening modal
await testModalOpen('open-dialog-button', 'Are you sure?')

// Test closing with escape key
await testModalClose('escape')

// Test focus trap
await testModalFocusTrap('confirmation-modal')
```

---

## Async Testing

**File:** `test/utils/async-test-utils.ts`

### Async Utilities

#### `waitForCondition(condition, timeout, message)`

Wait for a condition to be true.

```typescript
await waitForCondition(
  () => data.isLoaded,
  5000,
  'Data failed to load'
)
```

#### `mockAsyncOperation(data, delay, shouldFail)`

Mock async operation.

```typescript
const fetchData = mockAsyncOperation({ id: 1 }, 100, false)
const result = await fetchData()
```

### Testing Patterns

- `testLoadingStateSequence(getState, operation)` - Test loading sequence
- `testRetryMechanism(operation, maxRetries)` - Test retry logic
- `testDebouncedFunction(fn, delay, callCount)` - Test debouncing
- `testThrottledFunction(fn, delay, callCount)` - Test throttling
- `testConcurrentOperations(operations)` - Test parallel execution
- `testSequentialOperations(operations)` - Test sequential execution
- `testTimeout(operation, timeout, shouldTimeout)` - Test timeouts
- `testCancellableOperation(createOp)` - Test cancellation
- `testPolling(pollFn, interval, maxPolls)` - Test polling

**Example:**

```typescript
await testLoadingStateSequence(
  () => component.isLoading,
  async () => await fetchData(),
  1000 // Expected duration
)
```

### Fake Timers

```typescript
await testWithFakeTimers(async () => {
  const promise = delayedOperation()
  advanceTimersByTime(1000)
  await promise
})
```

---

## Data Display Testing

**File:** `test/utils/data-test-utils.ts`

### Table Testing

- `testTableRendering(headers, rowCount)` - Test table structure
- `testTableSorting(column, order)` - Test sorting
- `testTableFiltering(value, expectedCount)` - Test filtering
- `testTablePagination(page, totalPages, perPage)` - Test pagination
- `testTableRowSelection(index, isMulti)` - Test row selection

**Example:**

```typescript
testTableRendering(
  ['Name', 'Price', 'Brand'],
  10
)

await testTableSorting('Name', 'asc')

await testTableFiltering('santal', 3)
```

### List and Grid Testing

- `testListRendering(items, type)` - Test list structure
- `testDataGridCellEditing(row, col, value)` - Test cell editing
- `testVirtualizedList(total, visible)` - Test virtualization
- `testInfiniteScroll(scrollFn, expectedItems)` - Test infinite scroll

### Data Operations

- `testDataLoadingStates()` - Test loading/empty/error states
- `testDataExport(format, fileName)` - Test data export
- `testDataRefresh()` - Test refresh functionality
- `testColumnVisibility(column, visible)` - Test column toggle
- `testDataGrouping(groupBy, groups)` - Test grouping
- `testDataAggregation(tests)` - Test aggregations
- `testDataSearch(term, resultCount)` - Test search

**Example:**

```typescript
// Test table with all features
testTableRendering(['Name', 'Price', 'Brand'], 50)
await testTableSorting('Price', 'desc')
await testTableFiltering('niche', 15)
await testColumnVisibility('Brand', false)
await testDataGrouping('Type', ['Eau de Parfum', 'Eau de Toilette'])
```

---

## Best Practices

### 1. Use Central Import

```typescript
// ✅ Good
import { renderWithProviders, testFormValidation } from 'test/utils'

// ❌ Bad
import { renderWithProviders } from 'test/utils/test-utils'
import { testFormValidation } from 'test/utils/form-test-utils'
```

### 2. Combine Utilities

```typescript
test('complete user flow', async () => {
  // Setup
  setViewportByName('mobile')
  const { history } = renderWithRouter(<App />)
  
  // Test auth
  await testLoginFlow(<LoginPage />, credentials)
  
  // Test navigation
  await testNavigation(<Dashboard />, navigationSteps)
  
  // Test accessibility
  await testKeyboardNavigation(<Dashboard />)
})
```

### 3. Use Factories with Utilities

```typescript
import { createMockPerfume, testTableRendering } from 'test/utils'

test('perfume list', () => {
  const perfumes = Array.from({ length: 10 }, (_, i) => 
    createMockPerfume({ id: `${i}` })
  )
  
  renderWithProviders(<PerfumeList perfumes={perfumes} />)
  testTableRendering(['Name', 'Brand', 'Price'], 10)
})
```

### 4. Async Testing

```typescript
test('data loading', async () => {
  const mockFetch = mockAsyncOperation(data, 100)
  
  await testLoadingStateSequence(
    () => component.loading,
    mockFetch
  )
})
```

### 5. Comprehensive Testing

```typescript
test('modal component', async () => {
  // Test opening
  await testModalOpen('trigger', 'Modal content')
  
  // Test accessibility
  testModalAccessibility()
  
  // Test focus trap
  await testModalFocusTrap('modal')
  
  // Test closing
  await testModalClose('escape')
})
```

---

## Adding New Utilities

When adding new utilities:

1. Create a new file in `test/utils/` with a descriptive name
2. Add JSDoc comments explaining the purpose
3. Export functions from the file
4. Add exports to `test/utils/index.ts`
5. Document in this README
6. Write tests for the utilities themselves

---

## Related Documentation

- [Test Factories](../factories/README.md) - Data generation utilities
- [Integration Testing](../integration/README.md) - Integration test patterns
- [E2E Testing](../e2e/README.md) - End-to-end test patterns
- [Performance Testing](../performance/README.md) - Performance test utilities

---

## Troubleshooting

### Issue: TypeScript errors when importing

**Solution:** Ensure you're importing from the index:

```typescript
import { renderWithProviders } from 'test/utils'
```

### Issue: Mock not working

**Solution:** Verify mock setup before component render:

```typescript
mockMatchMedia(true) // Setup mock first
renderWithProviders(<Component />)
```

### Issue: Async tests timing out

**Solution:** Increase timeout or use fake timers:

```typescript
await waitForCondition(condition, 10000) // 10s timeout

// Or use fake timers
await testWithFakeTimers(async () => {
  // ... test code
})
```

---

## Contributing

When contributing new test utilities:

1. Follow existing patterns and naming conventions
2. Add comprehensive JSDoc comments
3. Include usage examples
4. Update this README
5. Ensure TypeScript types are correct
6. Write tests for the utility functions themselves

