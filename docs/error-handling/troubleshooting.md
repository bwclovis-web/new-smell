# Error Handling Troubleshooting Guide

**Last Updated:** October 31, 2025

## Table of Contents

- [Common Issues](#common-issues)
- [Error Messages](#error-messages)
- [Performance Issues](#performance-issues)
- [Debugging Tips](#debugging-tips)
- [Known Limitations](#known-limitations)
- [FAQ](#faq)

## Common Issues

### Issue 1: Errors Not Being Caught

**Symptoms:**

- Unhandled promise rejections in console
- Application crashes without error message
- No error logging

**Causes:**

1. Missing try-catch blocks
2. Not using error handling wrappers
3. Async errors not properly awaited

**Solutions:**

❌ **Problem:**

```typescript
// Missing await
function fetchData() {
  fetch("/api/data") // Unhandled promise
}
```

✅ **Solution:**

```typescript
async function fetchData() {
  try {
    const response = await fetch("/api/data")
    if (!response.ok) throw response
    return await response.json()
  } catch (error) {
    throw createError.network("Failed to fetch data", {
      originalError: error,
    })
  }
}
```

❌ **Problem:**

```typescript
// Missing error handler wrapper
export const loader = async ({ request }) => {
  // Errors here are not properly handled
}
```

✅ **Solution:**

```typescript
export const loader = withLoaderErrorHandling(async ({ request }) => {
  // Errors here are automatically handled
})
```

### Issue 2: Sensitive Data in Error Logs

**Symptoms:**

- Passwords, tokens, or API keys visible in logs
- Security audit warnings

**Causes:**

1. Including sensitive data in error context
2. Not using sanitization
3. Logging raw error objects

**Solutions:**

❌ **Problem:**

```typescript
throw createError.server("Auth failed", {
  password: user.password,
  token: session.token,
})
```

✅ **Solution:**

```typescript
throw createError.server("Auth failed", {
  userId: user.id,
  attemptedAction: "login",
})
// Password and token are automatically sanitized if accidentally included
```

**Verify Sanitization:**

```typescript
import { sanitizeContext } from "~/utils/errorHandling"

const context = {
  password: "secret",
  username: "john",
}

const sanitized = sanitizeContext(context)
// { password: '[REDACTED]', username: 'john' }
```

### Issue 3: Retries Not Working

**Symptoms:**

- Transient errors failing immediately
- No retry attempts logged
- `isRetrying` always false

**Causes:**

1. Using non-retryable error types
2. Custom retry conditions too restrictive
3. Not using retry wrappers

**Solutions:**

❌ **Problem:**

```typescript
// Validation errors are not retryable
throw createError.validation("Server error") // Wrong error type
```

✅ **Solution:**

```typescript
// Use correct error type
throw createError.server("Server error") // Retryable
throw createError.network("Network error") // Retryable
```

**Check Retry Configuration:**

```typescript
import { isRetryableError } from "~/utils/retry"

const error = createError.validation("Bad input")
console.log(isRetryableError(error)) // false - validation errors are not retryable

const error2 = createError.network("Connection failed")
console.log(isRetryableError(error2)) // true - network errors are retryable
```

**Use Retry Hook:**

```typescript
const { fetchWithRetry, isRetrying, retryCount } = useApiWithRetry({
  onRetry: (error, attempt, delay) => {
    console.log(`Retry ${attempt} after ${delay}ms`)
  },
})

// Verify retries are happening
useEffect(() => {
  if (isRetrying) {
    console.log(`Currently retrying, attempt: ${retryCount}`)
  }
}, [isRetrying, retryCount])
```

### Issue 4: ErrorBoundary Not Catching Errors

**Symptoms:**

- Errors pass through ErrorBoundary
- App crashes even with ErrorBoundary
- Fallback UI not showing

**Causes:**

1. Event handler errors (not caught by ErrorBoundary)
2. Async errors without proper handling
3. Errors in ErrorBoundary itself

**Solutions:**

❌ **Problem:**

```tsx
function Component() {
  // Event handler errors are NOT caught by ErrorBoundary
  const handleClick = () => {
    throw new Error("Click error")
  }

  return <button onClick={handleClick}>Click</button>
}
```

✅ **Solution:**

```tsx
function Component() {
  const { handleError } = useErrorHandler()

  const handleClick = () => {
    try {
      // Your code
      throw new Error("Click error")
    } catch (error) {
      handleError(error) // Manually handle event errors
    }
  }

  return <button onClick={handleClick}>Click</button>
}
```

❌ **Problem:**

```tsx
function Component() {
  useEffect(() => {
    fetch("/api/data") // Unhandled async error
  }, [])
}
```

✅ **Solution:**

```tsx
function Component() {
  const { handleApiError } = useApiErrorHandler()

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .catch((error) => handleApiError(error, "/api/data", "GET"))
  }, [])
}
```

### Issue 5: Correlation IDs Missing

**Symptoms:**

- Cannot track errors across requests
- Correlation ID is undefined
- Debugging is difficult

**Causes:**

1. Server-side only feature used on client
2. AsyncLocalStorage not available
3. Missing correlation ID middleware

**Solutions:**

**Verify Correlation ID Setup:**

```typescript
// entry.server.tsx should have:
import { setCorrelationId } from "~/utils/correlationId.server"

export default async function handleRequest(request: Request) {
  // Set correlation ID from header or generate new one
  const correlationId =
    request.headers.get("X-Correlation-ID") || crypto.randomUUID()
  setCorrelationId(correlationId)

  // ... rest of handler
}
```

**Check in Route:**

```typescript
import { getCorrelationId } from "~/utils/correlationId.server"

export const loader = withLoaderErrorHandling(async ({ request }) => {
  const correlationId = getCorrelationId()
  console.log("Correlation ID:", correlationId) // Should not be undefined
})
```

### Issue 6: Memory Leaks in ErrorLogger

**Symptoms:**

- Increasing memory usage
- Application slowdown over time
- Out of memory errors

**Causes:**

1. Too many errors being logged
2. MAX_LOGS not properly enforced
3. Circular references in error context

**Solutions:**

**Check Log Count:**

```typescript
const logger = ErrorLogger.getInstance()
console.log("Current log count:", logger.getLogCount())
console.log("Max logs:", 1000) // Should be the limit
```

**Clear Logs Periodically:**

```typescript
// In long-running processes
setInterval(() => {
  const logger = ErrorLogger.getInstance()
  if (logger.getLogCount() > 900) {
    logger.clearLogs()
    console.log("Logs cleared to prevent memory issues")
  }
}, 60000) // Every minute
```

**Avoid Circular References:**

```typescript
// ❌ Bad
const user = { ... }
user.self = user // Circular reference

throw createError.server('Error', { user })

// ✅ Good
throw createError.server('Error', {
  userId: user.id,
  username: user.name
})
```

## Error Messages

### Understanding Error Messages

#### Client-Side Errors

**"Network request failed"**

- **Cause:** Connection to server lost or server unavailable
- **Solution:** Check network connection, verify server is running
- **Retry:** Automatic with `useApiWithRetry`

**"Request timeout"**

- **Cause:** Server took too long to respond
- **Solution:** Increase timeout, check server performance
- **Retry:** Automatic with retry mechanism

**"Invalid response format"**

- **Cause:** Server returned unexpected data structure
- **Solution:** Verify API endpoint, check for API version mismatches

#### Server-Side Errors

**"Database connection failed"**

- **Cause:** Cannot connect to database
- **Solution:** Check DATABASE_URL, verify database is running
- **Logs:** Check server logs for detailed connection errors

**"Query timeout"**

- **Cause:** Database query took too long
- **Solution:** Optimize query, add indexes, check for N+1 problems

**"Unique constraint violation"**

- **Cause:** Attempting to insert duplicate data
- **Solution:** Handle duplicate entries gracefully, show user-friendly message

## Performance Issues

### Slow Error Handling

**Symptoms:**

- Noticeable delay when errors occur
- High overhead in error handlers
- Slow page loads after errors

**Diagnosis:**

```typescript
// Measure error handling overhead
const start = performance.now()
try {
  throw createError.validation("Test")
} catch (error) {
  // Handle error
}
const duration = performance.now() - start
console.log("Error handling took:", duration, "ms")
// Should be < 100ms
```

**Solutions:**

1. **Reduce Error Context Size:**

```typescript
// ❌ Bad - Large context
throw createError.server('Error', {
  hugeArray: Array(10000).fill('data'),
  largeObject: /* giant object */
})

// ✅ Good - Minimal context
throw createError.server('Error', {
  itemCount: hugeArray.length,
  objectKeys: Object.keys(largeObject)
})
```

2. **Avoid Excessive Logging:**

```typescript
// ❌ Bad - Log everything
for (const item of items) {
  logger.log(createError.validation("Item error"), userId)
}

// ✅ Good - Batch or sample
const errors = items.filter((item) => !isValid(item))
if (errors.length > 0) {
  logger.log(
    createError.validation("Multiple validation errors", {
      count: errors.length,
      sample: errors.slice(0, 5),
    }),
    userId
  )
}
```

### High Memory Usage

**Symptoms:**

- Steadily increasing memory
- Slowdown over time
- Memory warnings

**Diagnosis:**

```typescript
// Check ErrorLogger memory usage
const logger = ErrorLogger.getInstance()
const logCount = logger.getLogCount()
const estimatedMemory = logCount * 1024 // Rough estimate

console.log(`ErrorLogger using ~${estimatedMemory / 1024}KB for ${logCount} logs`)
```

**Solutions:**

1. **Clear Old Logs:**

```typescript
// Clear logs when they exceed threshold
if (logger.getLogCount() > 900) {
  logger.clearLogs()
}
```

2. **Reduce Log Retention:**

```typescript
// Get only recent logs
const recentLogs = logger.getLogs(100) // Last 100 only
```

## Debugging Tips

### Enable Verbose Logging

**Development Mode:**

```typescript
// In entry.server.tsx or app root
if (process.env.NODE_ENV === "development") {
  window.ERROR_DEBUG = true
}

// In error handlers
if (window.ERROR_DEBUG) {
  console.log("Error details:", {
    type: error.type,
    severity: error.severity,
    stack: error.stack,
    context: error.context,
  })
}
```

### Use Correlation IDs

```typescript
// Track request across services
export const loader = withLoaderErrorHandling(async ({ request }) => {
  const correlationId = getCorrelationId()
  console.log(`[${correlationId}] Processing request`)

  try {
    const data = await fetchData()
    console.log(`[${correlationId}] Data fetched successfully`)
    return data
  } catch (error) {
    console.error(`[${correlationId}] Error fetching data:`, error)
    throw error
  }
})
```

### Inspect Error Logs

```typescript
// Get all error logs
const logger = ErrorLogger.getInstance()
const allLogs = logger.getLogs()

// Filter by user
const userLogs = allLogs.filter((log) => log.userId === "user-123")

// Filter by time
const recentLogs = allLogs.filter(
  (log) => log.timestamp > new Date(Date.now() - 3600000) // Last hour
)

// Export for analysis
console.table(
  allLogs.map((log) => ({
    id: log.id,
    type: log.error.type,
    message: log.error.message,
    timestamp: log.timestamp,
  }))
)
```

### Test Error Scenarios

```typescript
// Create test errors to verify handling
if (process.env.NODE_ENV === "development") {
  window.testError = (type: string) => {
    const errors = {
      validation: () => createError.validation("Test validation error"),
      network: () => createError.network("Test network error"),
      server: () => createError.server("Test server error"),
      auth: () => createError.authentication("Test auth error"),
    }

    throw errors[type]?.() || createError.unknown("Unknown test type")
  }
}

// Usage in console:
// testError('network')
```

## Known Limitations

### 1. ErrorBoundary Limitations

- **Cannot catch:**
  - Event handler errors (use try-catch)
  - Async errors without await
  - Errors in ErrorBoundary itself
  - Server-side rendering errors

### 2. Retry Mechanism Limitations

- **Will not retry:**
  - Validation errors (user input issues)
  - Authentication errors (need user action)
  - Authorization errors (permission issues)
  - NOT_FOUND errors (resource doesn't exist)
- **Limitations:**
  - Maximum 10 retry attempts
  - Total retry time capped at maxDelay \* maxRetries
  - Does not persist across page reloads

### 3. ErrorLogger Limitations

- **In-memory only:**

  - Logs lost on server restart
  - Limited to 1000 most recent errors
  - Not suitable for production monitoring (use external service)

- **No filtering:**
  - Cannot filter by error type in real-time
  - No search functionality
  - Limited query capabilities

### 4. Correlation ID Limitations

- **Server-side only:**
  - Not available on client-side
  - Requires AsyncLocalStorage support
  - Lost between different async contexts

### 5. Performance Constraints

- **Error handling adds ~5-15ms overhead:**
  - Acceptable for most use cases
  - May accumulate with many errors
  - Consider batching for high-frequency errors

## FAQ

### Q: Should I use ErrorBoundary or try-catch?

**A:** Use both for different scenarios:

- **ErrorBoundary:** For React component render errors
- **try-catch:** For event handlers, async operations, and server-side code

```tsx
// ErrorBoundary for component trees
;<ErrorBoundary>
  <MyComponent /> {/* Catches render errors */}
</ErrorBoundary>

// try-catch for event handlers
const handleClick = async () => {
  try {
    await submitData()
  } catch (error) {
    handleError(error)
  }
}
```

### Q: When should I use retry mechanisms?

**A:** Use retries for transient failures:

- ✅ Network timeouts
- ✅ Server errors (500, 502, 503)
- ✅ Rate limiting (429)
- ❌ Validation errors (400)
- ❌ Authentication errors (401)
- ❌ Not found errors (404)

### Q: How do I add custom error types?

**A:** Extend the ErrorType enum and createError factory:

```typescript
// Add to ErrorType enum
export enum ErrorType {
  // ... existing types
  RATE_LIMIT = "RATE_LIMIT",
}

// Add factory method
export const createError = {
  // ... existing methods
  rateLimit: (message: string, context?: Record<string, any>) =>
    new AppError(message, ErrorType.RATE_LIMIT, ErrorSeverity.MEDIUM, context),
}
```

### Q: How do I integrate with external monitoring services?

**A:** Implement in ErrorLogger's `sendToExternalLogger`:

```typescript
// app/utils/errorHandling.ts
private sendToExternalLogger(error: AppError, userId?: string, correlationId?: string): void {
  // Example: Sentry
  if (typeof Sentry !== 'undefined') {
    Sentry.captureException(error, {
      user: { id: userId },
      tags: { correlationId },
      extra: error.context
    })
  }

  // Example: Custom endpoint
  if (process.env.ERROR_LOGGING_ENDPOINT) {
    fetch(process.env.ERROR_LOGGING_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({
        ...error.toJSON(false),
        userId,
        correlationId
      })
    }).catch(console.error)
  }
}
```

### Q: How do I test error handling in E2E tests?

**A:** Use route interception and error simulation:

```typescript
import { test, expect } from "@playwright/test"

test("handles API errors gracefully", async ({ page }) => {
  // Intercept API calls and return error
  await page.route("**/api/data", (route) => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: "Server error" }),
    })
  })

  await page.goto("/data")

  // Verify error message is shown
  await expect(page.locator('[role="alert"]')).toContainText("Server error")

  // Verify retry button exists
  await expect(page.locator('button:has-text("Retry")')).toBeVisible()
})
```

### Q: How do I handle errors in loaders vs actions?

**A:** Same pattern, different wrappers:

```typescript
// Loader (GET requests)
export const loader = withLoaderErrorHandling(async ({ request }) => {
  // Errors here result in error response
  // User stays on current page
})

// Action (POST/PUT/DELETE requests)
export const action = withActionErrorHandling(async ({ request }) => {
  // Errors here result in error response
  // User sees error on form/action page
})
```

### Q: Can I customize error messages per route?

**A:** Yes, using route-specific error boundaries:

```tsx
// routes/admin.tsx
export function ErrorBoundary() {
  const error = useRouteError()

  return (
    <div>
      <h1>Admin Area Error</h1>
      <p>Something went wrong in the admin panel.</p>
      <ErrorDisplay error={error} />
    </div>
  )
}
```

---

**Still having issues?**

1. Check the [Developer Guide](./ERROR_HANDLING_DEVELOPER_GUIDE.md) for implementation details
2. Review [Error Handling Improvement Plan](./ERROR_HANDLING_IMPROVEMENT_PLAN.md) for system architecture
3. Check test files for examples:
   - `test/utils/errorHandling.server.test.ts`
   - `test/hooks/useApiWithRetry.test.tsx`
   - `test/e2e/error-handling.test.ts`

_Last Updated: October 31, 2025_
