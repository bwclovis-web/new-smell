# Error Handling Developer Guide

**Last Updated:** October 31, 2025

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Error Types](#error-types)
- [Creating Errors](#creating-errors)
- [Client-Side Error Handling](#client-side-error-handling)
- [Server-Side Error Handling](#server-side-error-handling)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Testing Error Handling](#testing-error-handling)
- [Troubleshooting](#troubleshooting)

## Overview

This guide covers the comprehensive error handling system implemented in New Smell. The system provides:

✅ Type-safe error handling  
✅ Automatic error logging and tracking  
✅ Automatic retry for transient failures  
✅ User-friendly error messages  
✅ Security (no sensitive data exposure)  
✅ Performance optimized (< 100ms overhead)  
✅ Correlation IDs for debugging  

## Quick Start

### Basic Usage

**Client-Side (React Component):**
```tsx
import { useApiErrorHandler } from '~/hooks/useErrorHandler'

function MyComponent() {
  const { error, isError, handleApiError, clearError } = useApiErrorHandler()

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data')
      if (!response.ok) throw response
      const data = await response.json()
      return data
    } catch (error) {
      handleApiError(error, '/api/data', 'GET')
      return null
    }
  }

  return (
    <div>
      {isError && <ErrorDisplay error={error} onRetry={fetchData} />}
      {/* Your component UI */}
    </div>
  )
}
```

**Server-Side (Route Loader):**
```typescript
import { withLoaderErrorHandling } from '~/utils/errorHandling.server'
import { createError } from '~/utils/errorHandling'

export const loader = withLoaderErrorHandling(async ({ request, params }) => {
  const id = params.id
  if (!id) {
    throw createError.validation('Missing required ID parameter')
  }

  const data = await db.getData(id)
  if (!data) {
    throw createError.notFound(`Data with ID ${id} not found`)
  }

  return data
})
```

## Error Types

The system supports multiple error types, each mapped to appropriate HTTP status codes:

### Available Error Types

```typescript
enum ErrorType {
  VALIDATION = 'VALIDATION',           // 400 - Bad Request
  AUTHENTICATION = 'AUTHENTICATION',   // 401 - Unauthorized
  AUTHORIZATION = 'AUTHORIZATION',     // 403 - Forbidden
  NOT_FOUND = 'NOT_FOUND',            // 404 - Not Found
  CLIENT = 'CLIENT',                   // 400 - Bad Request
  SERVER = 'SERVER',                   // 500 - Internal Server Error
  NETWORK = 'NETWORK',                 // 503 - Service Unavailable
  DATABASE = 'DATABASE',               // 500 - Internal Server Error
  EXTERNAL_API = 'EXTERNAL_API',       // 502 - Bad Gateway
  UNKNOWN = 'UNKNOWN'                  // 500 - Internal Server Error
}
```

### Error Severity Levels

```typescript
enum ErrorSeverity {
  LOW = 'LOW',           // Minor issues, app can continue
  MEDIUM = 'MEDIUM',     // Significant but recoverable
  HIGH = 'HIGH',         // Major issues requiring attention
  CRITICAL = 'CRITICAL'  // System-critical, immediate action needed
}
```

## Creating Errors

### Using Error Factory

The `createError` factory provides type-safe error creation:

```typescript
import { createError } from '~/utils/errorHandling'

// Validation errors
throw createError.validation('Email is required', {
  field: 'email',
  value: userInput
})

// Authentication errors
throw createError.authentication('Invalid credentials')

// Authorization errors
throw createError.authorization('Insufficient permissions', {
  required: 'admin',
  actual: 'user'
})

// Not found errors
throw createError.notFound('Resource not found', {
  resourceType: 'perfume',
  id: perfumeId
})

// Network errors
throw createError.network('Failed to connect to API', {
  endpoint: 'https://api.example.com',
  timeout: 5000
})

// Server errors
throw createError.server('Database connection failed', {
  originalError: error,
  query: 'SELECT * FROM ...'
})

// Database errors
throw createError.database('Query failed', {
  table: 'users',
  operation: 'SELECT'
})

// Client errors
throw createError.client('Invalid request format')

// Unknown errors (fallback)
throw createError.unknown('Unexpected error occurred', {
  originalError: error
})
```

### Custom Error Creation

```typescript
import { AppError, ErrorType, ErrorSeverity } from '~/utils/errorHandling'

const customError = new AppError(
  'Custom error message',
  ErrorType.SERVER,
  ErrorSeverity.HIGH,
  {
    customField: 'value',
    userId: user.id
  }
)
```

## Client-Side Error Handling

### React Hooks

#### useApiErrorHandler

For API calls and async operations:

```tsx
import { useApiErrorHandler } from '~/hooks/useErrorHandler'

function DataFetcher() {
  const { error, isError, handleApiError, clearError } = useApiErrorHandler('user-123')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/data')
      if (!response.ok) {
        throw response
      }
      const json = await response.json()
      setData(json)
      clearError() // Clear any previous errors
    } catch (error) {
      handleApiError(error, '/api/data', 'GET')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {isError && (
        <ErrorDisplay 
          error={error} 
          onRetry={loadData}
          onDismiss={clearError}
        />
      )}
      {/* Component UI */}
    </div>
  )
}
```

#### useApiWithRetry

Automatic retry for transient failures:

```tsx
import { useApiWithRetry } from '~/hooks/useApiWithRetry'
import { retryPresets } from '~/utils/retry'

function RobustDataFetcher() {
  const { 
    fetchWithRetry, 
    fetchWithPreset,
    isLoading, 
    isRetrying, 
    retryCount,
    error 
  } = useApiWithRetry({
    userId: 'user-123',
    defaultRetryOptions: retryPresets.standard,
    onRetry: (error, attempt, delay) => {
      console.log(`Retry attempt ${attempt} after ${delay}ms`)
    }
  })

  const loadData = async () => {
    // Option 1: Use default retry options
    const data = await fetchWithRetry(
      () => fetch('/api/data').then(r => r.json()),
      { endpoint: '/api/data', method: 'GET' }
    )

    // Option 2: Use preset
    const data2 = await fetchWithPreset(
      () => fetch('/api/data').then(r => r.json()),
      'aggressive', // conservative, standard, aggressive, quick
      '/api/data',
      'GET'
    )
  }

  return (
    <div>
      {isLoading && <LoadingSpinner />}
      {isRetrying && <div>Retrying... (Attempt {retryCount})</div>}
      {error && <ErrorDisplay error={error} />}
    </div>
  )
}
```

### Error Boundaries

Catch errors in React component trees:

```tsx
import { ErrorBoundary } from '~/components/Containers/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary
      fallback={(error, resetError) => (
        <ErrorPage error={error} onReset={resetError} />
      )}
      onError={(error, errorInfo) => {
        // Log to external service
        console.error('ErrorBoundary caught:', error, errorInfo)
      }}
    >
      <YourApp />
    </ErrorBoundary>
  )
}
```

## Server-Side Error Handling

### Route Handlers

#### Loader Error Handling

```typescript
import { withLoaderErrorHandling } from '~/utils/errorHandling.server'
import { createError } from '~/utils/errorHandling'
import { requireUserId } from '~/utils/auth.server'

export const loader = withLoaderErrorHandling(async ({ request, params }) => {
  // Authentication
  const userId = await requireUserId(request)
  if (!userId) {
    throw createError.authentication('Please sign in to continue')
  }

  // Validation
  const id = params.id
  if (!id || !isValidId(id)) {
    throw createError.validation('Invalid ID format', { id })
  }

  // Database operations
  const data = await db.perfume.findUnique({ where: { id } })
  if (!data) {
    throw createError.notFound('Perfume not found', { id })
  }

  return json({ perfume: data })
})
```

#### Action Error Handling

```typescript
import { withActionErrorHandling } from '~/utils/errorHandling.server'
import { createError } from '~/utils/errorHandling'

export const action = withActionErrorHandling(async ({ request }) => {
  const formData = await request.formData()
  const name = formData.get('name')
  
  // Validation
  if (!name || name.length < 3) {
    throw createError.validation('Name must be at least 3 characters', {
      field: 'name',
      value: name
    })
  }

  // Database operation with error handling
  try {
    const result = await db.perfume.create({
      data: { name: String(name) }
    })
    return json({ success: true, perfume: result })
  } catch (error) {
    throw createError.database('Failed to create perfume', {
      originalError: error,
      operation: 'create'
    })
  }
})
```

### Database Error Handling

```typescript
import { DatabaseErrorHandler } from '~/utils/errorHandling.server'

const dbHandler = new DatabaseErrorHandler()

async function createUser(data: UserData) {
  try {
    return await db.user.create({ data })
  } catch (error) {
    // Automatically handles:
    // - Unique constraint violations
    // - Foreign key errors
    // - Connection errors
    // - Timeout errors
    return dbHandler.handleDatabaseError(error, {
      operation: 'create',
      table: 'user',
      data
    })
  }
}
```

### Authentication Error Handling

```typescript
import { AuthErrorHandler } from '~/utils/errorHandling.server'

const authHandler = new AuthErrorHandler()

async function verifyUser(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) {
      throw new Error('No session')
    }
    return session.userId
  } catch (error) {
    // Automatically handles:
    // - Missing tokens
    // - Expired sessions
    // - Invalid credentials
    // - Token verification failures
    return authHandler.handleAuthError(error, request)
  }
}
```

### Validation Error Handling

```typescript
import { ValidationErrorHandler } from '~/utils/errorHandling.server'
import { z } from 'zod'

const validationHandler = new ValidationErrorHandler()

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  age: z.number().min(18)
})

async function validateUserInput(data: unknown) {
  try {
    return userSchema.parse(data)
  } catch (error) {
    // Automatically converts Zod errors to user-friendly messages
    return validationHandler.handleValidationError(error, data)
  }
}
```

## Best Practices

### 1. Always Use Typed Errors

❌ **Bad:**
```typescript
throw new Error('Something went wrong')
```

✅ **Good:**
```typescript
throw createError.server('Database query failed', {
  query: 'SELECT ...',
  originalError: error
})
```

### 2. Provide Context

❌ **Bad:**
```typescript
throw createError.validation('Invalid input')
```

✅ **Good:**
```typescript
throw createError.validation('Email format is invalid', {
  field: 'email',
  value: userInput,
  expected: 'user@example.com'
})
```

### 3. Never Expose Sensitive Data

❌ **Bad:**
```typescript
throw createError.server('Error', {
  password: user.password,
  token: session.token
})
```

✅ **Good:**
```typescript
throw createError.server('Authentication failed', {
  userId: user.id,
  attemptedAction: 'login'
})
// Sensitive fields are automatically sanitized
```

### 4. Use Appropriate Error Types

```typescript
// Validation errors (user input)
if (!email) throw createError.validation('Email is required')

// Not found (resource doesn't exist)
if (!user) throw createError.notFound('User not found', { id: userId })

// Authentication (not logged in)
if (!session) throw createError.authentication('Please sign in')

// Authorization (logged in but no permission)
if (user.role !== 'admin') throw createError.authorization('Admin access required')

// Server errors (our fault)
catch (error) {
  throw createError.server('Internal error', { originalError: error })
}

// Network errors (external service)
if (apiResponse.status === 503) {
  throw createError.network('External service unavailable')
}
```

### 5. Use Retry for Transient Failures

```typescript
import { withRetry, retryPresets } from '~/utils/retry'

// Automatically retry network and server errors
const data = await withRetry(
  () => fetch('https://api.example.com/data').then(r => r.json()),
  retryPresets.standard // 3 retries with exponential backoff
)
```

### 6. Log Errors Appropriately

```typescript
import { ErrorLogger } from '~/utils/errorHandling'

const logger = ErrorLogger.getInstance()

try {
  await riskyOperation()
} catch (error) {
  const appError = createError.server('Operation failed', { originalError: error })
  logger.log(appError, userId) // Logs with correlation ID
  throw appError
}
```

### 7. Handle Errors Close to the Source

❌ **Bad:**
```typescript
// Deep in the code
async function fetchData() {
  return await fetch('/api/data') // No error handling
}

// Far away
function Component() {
  try {
    const data = await fetchData()
  } catch (error) {
    // Too late to add context
  }
}
```

✅ **Good:**
```typescript
async function fetchData() {
  try {
    const response = await fetch('/api/data')
    if (!response.ok) {
      throw createError.network('API request failed', {
        endpoint: '/api/data',
        status: response.status
      })
    }
    return await response.json()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw createError.unknown('Unexpected error in fetchData', {
      originalError: error
    })
  }
}
```

## Common Patterns

### Pattern 1: Form Submission with Validation

```typescript
// Route action
export const action = withActionErrorHandling(async ({ request }) => {
  const formData = await request.formData()
  
  // Validation
  const email = formData.get('email')
  if (!email || !isValidEmail(email)) {
    throw createError.validation('Invalid email address', {
      field: 'email',
      value: email
    })
  }

  // Database operation
  try {
    const user = await db.user.create({
      data: { email: String(email) }
    })
    return json({ success: true, user })
  } catch (error) {
    if (error.code === 'P2002') { // Unique constraint
      throw createError.validation('Email already exists', {
        field: 'email'
      })
    }
    throw createError.database('Failed to create user', {
      originalError: error
    })
  }
})

// Component
function SignUpForm() {
  const { error, isError, handleApiError } = useApiErrorHandler()
  const submit = useFetcher()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    try {
      submit.submit(formData, { method: 'post' })
    } catch (error) {
      handleApiError(error, '/signup', 'POST')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {isError && <ErrorDisplay error={error} />}
      {/* Form fields */}
    </form>
  )
}
```

### Pattern 2: API Call with Retry

```typescript
import { useApiWithRetry } from '~/hooks/useApiWithRetry'
import { retryPresets } from '~/utils/retry'

function DataList() {
  const { fetchWithPreset, isLoading, isRetrying, error } = useApiWithRetry({
    onRetry: (error, attempt, delay) => {
      toast.info(`Retrying in ${delay}ms... (Attempt ${attempt})`)
    }
  })

  const loadData = async () => {
    const data = await fetchWithPreset(
      async () => {
        const response = await fetch('/api/perfumes')
        if (!response.ok) throw response
        return response.json()
      },
      'standard', // 3 retries with exponential backoff
      '/api/perfumes',
      'GET'
    )
    
    if (data) {
      setItems(data)
    }
  }

  return (
    <div>
      {isRetrying && <div>Connection issues, retrying...</div>}
      {error && <ErrorDisplay error={error} onRetry={loadData} />}
      {/* List items */}
    </div>
  )
}
```

### Pattern 3: Protected Route

```typescript
// Route loader
export const loader = withLoaderErrorHandling(async ({ request }) => {
  // Check authentication
  const userId = await getUserId(request)
  if (!userId) {
    throw createError.authentication('Please sign in to continue', {
      redirectTo: '/login',
      returnTo: new URL(request.url).pathname
    })
  }

  // Check authorization
  const user = await db.user.findUnique({ where: { id: userId } })
  if (user.role !== 'admin') {
    throw createError.authorization('Admin access required', {
      required: 'admin',
      actual: user.role
    })
  }

  // Return protected data
  const data = await db.adminData.findMany()
  return json({ data })
})
```

### Pattern 4: External API Integration

```typescript
import { withRetry, retryPresets } from '~/utils/retry'
import { createError } from '~/utils/errorHandling'

async function callExternalAPI(endpoint: string) {
  return withRetry(
    async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      try {
        const response = await fetch(`https://api.example.com${endpoint}`, {
          signal: controller.signal
        })

        if (!response.ok) {
          throw createError.externalApi('API request failed', {
            endpoint,
            status: response.status,
            statusText: response.statusText
          })
        }

        return await response.json()
      } catch (error) {
        if (error.name === 'AbortError') {
          throw createError.network('Request timeout', {
            endpoint,
            timeout: 5000
          })
        }
        throw error
      } finally {
        clearTimeout(timeoutId)
      }
    },
    retryPresets.aggressive // 5 retries for external APIs
  )
}
```

## Testing Error Handling

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest'
import { createError, AppError } from '~/utils/errorHandling'

describe('Error Creation', () => {
  it('creates validation error with correct type', () => {
    const error = createError.validation('Invalid input', { field: 'email' })
    
    expect(error).toBeInstanceOf(AppError)
    expect(error.type).toBe('VALIDATION')
    expect(error.message).toBe('Invalid input')
    expect(error.context.field).toBe('email')
  })

  it('sanitizes sensitive data', () => {
    const error = createError.server('Error', {
      password: 'secret123',
      token: 'bearer-token',
      safeData: 'visible'
    })
    
    const json = error.toJSON()
    expect(json.context.password).toBe('[REDACTED]')
    expect(json.context.token).toBe('[REDACTED]')
    expect(json.context.safeData).toBe('visible')
  })
})
```

### Integration Tests

```typescript
import { test, expect } from '@playwright/test'

test('displays error message on validation failure', async ({ page }) => {
  await page.goto('/signup')
  
  // Submit without email
  await page.click('button[type="submit"]')
  
  // Check error message
  await expect(page.locator('[role="alert"]')).toContainText('Email is required')
})

test('retries on network failure', async ({ page }) => {
  // Simulate network failure
  await page.route('**/api/data', route => route.abort())
  
  await page.goto('/data')
  
  // Should show retry message
  await expect(page.locator('text=Retrying')).toBeVisible()
})
```

### Performance Tests

```typescript
import { describe, it, expect } from 'vitest'
import { measurePerformance } from '~/test/utils'

describe('Error Handling Performance', () => {
  it('creates errors with minimal overhead', () => {
    const duration = measurePerformance(() => {
      for (let i = 0; i < 1000; i++) {
        createError.validation(`Error ${i}`)
      }
    })
    
    // Should be under 100ms for 1000 errors
    expect(duration).toBeLessThan(100)
  })
})
```

## Troubleshooting

See the [Error Handling Troubleshooting Guide](./ERROR_HANDLING_TROUBLESHOOTING.md) for common issues and solutions.

## Additional Resources

- **[ERROR_HANDLING_IMPROVEMENT_PLAN.md](./ERROR_HANDLING_IMPROVEMENT_PLAN.md)** - Complete implementation plan
- **[ERROR_HANDLING_TROUBLESHOOTING.md](./ERROR_HANDLING_TROUBLESHOOTING.md)** - Troubleshooting guide
- **[PERFORMANCE_TESTING_SUMMARY.md](./PERFORMANCE_TESTING_SUMMARY.md)** - Performance metrics
- **Test Examples:**
  - `test/utils/errorHandling.server.test.ts` - Server-side error handling tests
  - `test/hooks/useApiWithRetry.test.tsx` - Client-side retry tests
  - `test/performance/error-handling-overhead.perf.test.ts` - Performance tests

---

*For questions or issues, refer to the troubleshooting guide or reach out to the development team.*

