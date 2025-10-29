# Error Handling Improvement Plan

## Executive Summary

**Status:** 🟡 Infrastructure exists but inconsistently applied  
**Impact:** 🔥 HIGH - Affects user experience, debugging, and system reliability  
**Effort:** ⏱️ 3-4 days (24-32 hours)  
**Priority:** ⭐ HIGH  
**Start Date:** October 29, 2025

---

## Table of Contents

1. [Current State Assessment](#current-state-assessment)
2. [Risk Analysis](#risk-analysis)
3. [Implementation Strategy](#implementation-strategy)
4. [Detailed Implementation Steps](#detailed-implementation-steps)
5. [Testing Strategy](#testing-strategy)
6. [Success Metrics](#success-metrics)
7. [Implementation Checklist](#implementation-checklist)

---

## Current State Assessment

### ✅ Strengths

**Infrastructure Exists:**
- ✅ `AppError` class with comprehensive error typing
- ✅ `ErrorHandler` for centralized error processing
- ✅ `ServerErrorHandler` with loader/action-specific handling
- ✅ Specialized handlers: `DatabaseErrorHandler`, `AuthErrorHandler`, `ValidationErrorHandler`
- ✅ `ErrorLogger` for error tracking
- ✅ React hooks: `useErrorHandler`, `useAsyncErrorHandler`, `useFormErrorHandler`, `useApiErrorHandler`
- ✅ `ErrorBoundary` components fully tested (157 tests)
- ✅ Error types, severity levels, and categories defined

**Good Patterns Identified:**
```typescript
// app/routes/login/SignInPage.tsx - GOOD EXAMPLE
const appError = AuthErrorHandler.handle(error, {
  formData: formData ? Object.fromEntries(formData) : {},
  action: 'signIn'
})
return { error: appError.userMessage }
```

### ⚠️ Weaknesses & Gaps

**1. Inconsistent Application (🔴 HIGH RISK)**

**Problem:**
- Many routes don't use centralized error handlers
- Direct `console.error` usage instead of `ErrorLogger`
- Inconsistent error response formats
- Ad-hoc error handling in loaders/actions

**Examples of Inconsistency:**
```typescript
// app/routes/api/data-quality.tsx - INCONSISTENT
catch (error) {
  console.error('[DATA QUALITY API] Error:', error)  // Direct console.error
  return new Response(JSON.stringify({
    error: `Critical error...`,  // Custom format
    stack: error instanceof Error ? error.stack : undefined
  }), { status: 500 })
}

// app/routes/admin/rate-limit-stats.tsx - INCONSISTENT
catch (error) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Failed to get rate limit stats:', error)  // Direct console.error
  }
  return Response.json({
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error'  // Custom format
  }, { status: 500 })
}

// app/routes/admin/users.tsx - INCOMPLETE
catch (error) {
  console.error('Error loading users:', error)  // No ErrorHandler usage
  return { users: [], currentUser: user }  // Silent failure
}
```

**2. Missing Production Error Monitoring (🔴 HIGH RISK)**

**Problem:**
- No integration with error monitoring services (Sentry, DataDog, etc.)
- `ErrorLogger` stores errors in memory only (lost on restart)
- No alerting for critical errors
- No error aggregation or analytics

**3. Limited Error Recovery Strategies (🟡 MEDIUM RISK)**

**Problem:**
- No retry mechanisms for transient failures
- No circuit breaker patterns for external dependencies
- No graceful degradation strategies
- No fallback mechanisms

**4. Incomplete Error Context (🟡 MEDIUM RISK)**

**Problem:**
- Missing request context (headers, user agent, IP)
- No error correlation IDs for distributed tracing
- Limited breadcrumb tracking
- No performance metrics attached to errors

**5. User Experience Gaps (🟡 MEDIUM RISK)**

**Problem:**
- Generic error messages in some routes
- No user-friendly error recovery suggestions
- Inconsistent error UI components
- No offline error handling

**6. Security Concerns (🟠 MEDIUM-HIGH RISK)**

**Problem:**
- Stack traces exposed in some error responses
- Sensitive data may be logged in error context
- No sanitization of error messages before client exposure
- Missing rate limiting for error endpoints

---

## Risk Analysis

### 1. User Experience Risks

| Risk | Impact | Probability | Severity | Mitigation Priority |
|------|--------|-------------|----------|-------------------|
| Users see technical error messages | Users confused, lose trust | High | Medium | 🔴 HIGH |
| Errors not logged properly | Can't debug user issues | High | High | 🔴 HIGH |
| Silent failures | Users unaware of problems | Medium | High | 🔴 HIGH |
| No error recovery options | Users blocked from workflow | Medium | Medium | 🟡 MEDIUM |
| Inconsistent error UI | Poor UX, confusion | High | Low | 🟢 LOW |

### 2. Development & Maintenance Risks

| Risk | Impact | Probability | Severity | Mitigation Priority |
|------|--------|-------------|----------|-------------------|
| Difficult debugging in production | Long MTTR, frustrated developers | High | High | 🔴 HIGH |
| Missing error context | Can't reproduce issues | High | High | 🔴 HIGH |
| Inconsistent patterns | Code confusion, mistakes | High | Medium | 🟡 MEDIUM |
| No error analytics | Can't identify patterns | Medium | Medium | 🟡 MEDIUM |
| Technical debt accumulation | Harder to maintain | High | Medium | 🟡 MEDIUM |

### 3. Business Risks

| Risk | Impact | Probability | Severity | Mitigation Priority |
|------|--------|-------------|----------|-------------------|
| Lost conversions due to errors | Revenue impact | Medium | High | 🔴 HIGH |
| Users abandon after bad experience | Churn increase | Medium | High | 🔴 HIGH |
| Reputation damage | Negative reviews, word of mouth | Low | High | 🟡 MEDIUM |
| Compliance issues | Audit failures, fines | Low | High | 🟡 MEDIUM |
| No SLA monitoring | Can't meet commitments | Medium | Medium | 🟡 MEDIUM |

### 4. Security Risks

| Risk | Impact | Probability | Severity | Mitigation Priority |
|------|--------|-------------|----------|-------------------|
| Exposed stack traces | Information disclosure | High | Medium | 🔴 HIGH |
| Sensitive data in logs | Data breach risk | Medium | High | 🔴 HIGH |
| Error-based enumeration | Security vulnerability | Low | Medium | 🟡 MEDIUM |
| DoS via error generation | System unavailability | Low | High | 🟡 MEDIUM |

### 5. Performance Risks

| Risk | Impact | Probability | Severity | Mitigation Priority |
|------|--------|-------------|----------|-------------------|
| Error handling overhead | Slow response times | Low | Low | 🟢 LOW |
| Memory leaks in ErrorLogger | System instability | Medium | High | 🔴 HIGH |
| Unhandled promise rejections | Memory leaks, crashes | Low | High | 🟡 MEDIUM |
| Excessive error logging | Storage issues | Low | Medium | 🟢 LOW |

### Risk Mitigation Summary

**Critical Risks (Address First):**
1. 🔴 Users seeing technical error messages
2. 🔴 Errors not logged properly
3. 🔴 Silent failures in routes
4. 🔴 Missing error context for debugging
5. 🔴 Exposed stack traces (security)
6. 🔴 Sensitive data in logs
7. 🔴 Memory leaks in ErrorLogger

**High Priority Risks:**
- No error recovery options
- Lost conversions due to errors
- User churn after bad experiences
- Difficult debugging in production

**Medium Priority Risks:**
- Inconsistent error patterns
- No error analytics
- Inconsistent error UI

---

## Implementation Strategy

### Phase 1: Immediate Fixes (Day 1) - 8 hours

**Goal:** Eliminate critical security and silent failure risks

**Tasks:**
1. ✅ Sanitize all error responses (remove stack traces in production)
2. ✅ Implement consistent error response format across all routes
3. ✅ Replace all `console.error` with `ErrorLogger`
4. ✅ Fix silent failures in routes
5. ✅ Add error context sanitization

**Deliverables:**
- Security audit passing
- No exposed stack traces
- All errors logged consistently

### Phase 2: Standardization (Day 2) - 8 hours

**Goal:** Apply centralized error handling consistently

**Tasks:**
1. ✅ Audit all routes for error handling patterns
2. ✅ Refactor routes to use `ServerErrorHandler`
3. ✅ Implement standardized loader error handling
4. ✅ Implement standardized action error handling
5. ✅ Create error handling guidelines document

**Deliverables:**
- 100% of routes using centralized handlers
- Consistent error response format
- Developer documentation

### Phase 3: Enhanced Monitoring (Day 3) - 8 hours

**Goal:** Enable production error monitoring and debugging

**Tasks:**
1. ✅ Integrate error monitoring service (Sentry/DataDog)
2. ✅ Add correlation IDs to requests
3. ✅ Implement breadcrumb tracking
4. ✅ Create error analytics dashboard
5. ✅ Set up error alerting rules

**Deliverables:**
- Production error monitoring live
- Error dashboard accessible
- Alert rules configured

### Phase 4: User Experience (Day 4) - 8 hours

**Goal:** Improve error messaging and recovery

**Tasks:**
1. ✅ Audit all user-facing error messages
2. ✅ Implement user-friendly error messages
3. ✅ Add error recovery suggestions
4. ✅ Create retry mechanisms for transient failures
5. ✅ Implement graceful degradation patterns

**Deliverables:**
- User-friendly error messages
- Retry mechanisms in place
- Graceful degradation working

---

## Detailed Implementation Steps

### Step 1: Security Hardening (Priority 1)

#### 1.1 Sanitize Error Responses

**File:** `app/utils/errorHandling.server.ts`

**Changes:**
```typescript
// BEFORE
export const createErrorResponse = (error: AppError, status?: number): Response => {
  return new Response(
    JSON.stringify({
      success: false,
      error: error.toJSON()  // Exposes full error details including stack
    }),
    { status: status || 500 }
  )
}

// AFTER
export const createErrorResponse = (error: AppError, status?: number): Response => {
  const isProduction = process.env.NODE_ENV === 'production'
  
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: error.code,
        message: error.userMessage,
        type: error.type,
        severity: error.severity,
        // Only include technical details in development
        ...(isProduction ? {} : {
          technicalMessage: error.message,
          stack: error.stack,
          context: error.context
        })
      }
    }),
    {
      status: status || getHttpStatusFromError(error),
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'  // Don't cache error responses
      }
    }
  )
}

// Helper to map error types to HTTP status codes
function getHttpStatusFromError(error: AppError): number {
  const statusMap: Record<string, number> = {
    VALIDATION: 400,
    AUTHENTICATION: 401,
    AUTHORIZATION: 403,
    NOT_FOUND: 404,
    CLIENT: 400,
    SERVER: 500,
    DATABASE: 500,
    NETWORK: 502,
    UNKNOWN: 500
  }
  return statusMap[error.type] || 500
}
```

**Implementation:**
```bash
# 1. Update createErrorResponse function
# 2. Add getHttpStatusFromError helper
# 3. Test with sample errors
# 4. Verify no stack traces in production responses
```

**Testing:**
```typescript
// test/utils/errorHandling.server.test.ts
describe('createErrorResponse', () => {
  it('should not expose stack traces in production', () => {
    process.env.NODE_ENV = 'production'
    const error = createError.server('Test error')
    const response = createErrorResponse(error)
    const json = JSON.parse(response.body)
    expect(json.error.stack).toBeUndefined()
  })

  it('should expose stack traces in development', () => {
    process.env.NODE_ENV = 'development'
    const error = createError.server('Test error')
    const response = createErrorResponse(error)
    const json = JSON.parse(response.body)
    expect(json.error.stack).toBeDefined()
  })
})
```

#### 1.2 Sanitize Error Context

**File:** `app/utils/errorHandling.ts`

**Changes:**
```typescript
// Add context sanitization
const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'authorization',
  'cookie',
  'sessionId',
  'csrfToken',
  'creditCard',
  'ssn'
]

export function sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
  if (!context) return undefined

  const sanitized = { ...context }

  // Recursively sanitize nested objects
  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase()
    
    // Remove sensitive keys
    if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]'
      return
    }

    // Recursively sanitize nested objects
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeContext(sanitized[key])
    }
  })

  return sanitized
}

// Update ErrorLogger to use sanitization
export class ErrorLogger {
  // ...existing code...

  log(error: AppError, userId?: string): void {
    const logEntry = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId,
      error: {
        ...error.toJSON(),
        context: sanitizeContext(error.context)  // Sanitize before logging
      }
    }

    this.logs.push(logEntry)
    // Keep only last 1000 errors to prevent memory leaks
    if (this.logs.length > 1000) {
      this.logs.shift()
    }
  }
}
```

**Checklist:**
- [ ] Add SENSITIVE_KEYS array
- [ ] Implement sanitizeContext function
- [ ] Update ErrorLogger.log to sanitize
- [ ] Add tests for context sanitization
- [ ] Verify sensitive data is redacted

---

### Step 2: Standardize Route Error Handling (Priority 1)

#### 2.1 Create Route Error Handling Utility

**File:** `app/utils/errorHandling.server.ts` (enhance existing)

**Add:**
```typescript
/**
 * Standardized error handler wrapper for route loaders
 * 
 * Usage:
 * export const loader = withLoaderErrorHandling(async ({ request }) => {
 *   const data = await fetchData()
 *   return { data }
 * })
 */
export function withLoaderErrorHandling<T extends LoaderFunction>(
  loaderFn: T,
  options?: {
    context?: Record<string, any>
    redirectOnAuth?: string
    redirectOnAuthz?: string
  }
): T {
  return (async (args: LoaderFunctionArgs) => {
    try {
      return await loaderFn(args)
    } catch (error) {
      // Handle redirects (don't catch them)
      if (error instanceof Response && [302, 303].includes(error.status)) {
        throw error
      }

      const appError = ServerErrorHandler.handle(error, {
        ...options?.context,
        loader: true,
        path: args.request.url
      })

      // Handle authentication errors
      if (appError.type === 'AUTHENTICATION') {
        throw redirect(options?.redirectOnAuth || '/sign-in?error=auth_required')
      }

      // Handle authorization errors
      if (appError.type === 'AUTHORIZATION') {
        throw redirect(options?.redirectOnAuthz || '/unauthorized')
      }

      // For critical errors, redirect to error page
      if (appError.severity === 'CRITICAL') {
        throw redirect('/error?type=critical')
      }

      // For other errors, return error response
      return ServerErrorHandler.createErrorResponse(appError)
    }
  }) as T
}

/**
 * Standardized error handler wrapper for route actions
 * 
 * Usage:
 * export const action = withActionErrorHandling(async ({ request }) => {
 *   const formData = await request.formData()
 *   // ... process form
 *   return { success: true }
 * })
 */
export function withActionErrorHandling<T extends ActionFunction>(
  actionFn: T,
  options?: {
    context?: Record<string, any>
  }
): T {
  return (async (args: ActionFunctionArgs) => {
    try {
      return await actionFn(args)
    } catch (error) {
      // Handle redirects (don't catch them)
      if (error instanceof Response && [302, 303].includes(error.status)) {
        throw error
      }

      const appError = ServerErrorHandler.handle(error, {
        ...options?.context,
        action: true,
        path: args.request.url
      })

      // Return user-friendly error
      return {
        success: false,
        error: appError.userMessage,
        code: appError.code
      }
    }
  }) as T
}
```

#### 2.2 Refactor Inconsistent Routes

**Example 1: app/routes/api/data-quality.tsx**

```typescript
// BEFORE
export const loader = async ({ request }: { request: Request }) => {
  const url = new URL(request.url)
  const timeframe = url.searchParams.get('timeframe') || 'month'
  const force = url.searchParams.get('force') === 'true'

  try {
    const reportData = await generateDataQualityReport(timeframe, force)
    return new Response(JSON.stringify(reportData), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('[DATA QUALITY API] Error:', error)
    return new Response(
      JSON.stringify({
        error: `Critical error processing request: ${error instanceof Error ? error.message : String(error)}`,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// AFTER
export const loader = withLoaderErrorHandling(
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const timeframe = url.searchParams.get('timeframe') || 'month'
    const force = url.searchParams.get('force') === 'true'

    const reportData = await generateDataQualityReport(timeframe, force)
    
    return ServerErrorHandler.createSuccessResponse(reportData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  },
  {
    context: { api: 'data-quality' }
  }
)
```

**Example 2: app/routes/admin/rate-limit-stats.tsx**

```typescript
// BEFORE
export const loader = async () => {
  try {
    const stats = getRateLimitStats()
    return Response.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to get rate limit stats:', error)
    }
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.name : 'Unknown',
      stats: { /* fallback */ },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// AFTER
export const loader = withLoaderErrorHandling(
  async () => {
    const stats = getRateLimitStats()
    return ServerErrorHandler.createSuccessResponse({
      stats,
      timestamp: new Date().toISOString()
    })
  },
  {
    context: { api: 'rate-limit-stats' }
  }
)
```

**Example 3: app/routes/admin/users.tsx**

```typescript
// BEFORE
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await sharedLoader(request)

  if (!user || user.role !== 'admin') {
    throw new Response('Unauthorized', { status: 403 })
  }

  try {
    const users = await getAllUsersWithCounts()
    return { users, currentUser: user }
  } catch (error) {
    console.error('Error loading users:', error)
    return { users: [], currentUser: user }  // Silent failure
  }
}

// AFTER
export const loader = withLoaderErrorHandling(
  async ({ request }: LoaderFunctionArgs) => {
    const user = await sharedLoader(request)

    if (!user || user.role !== 'admin') {
      throw createError.authorization('Admin access required')
    }

    const users = await getAllUsersWithCounts()
    return { users, currentUser: user }
  },
  {
    context: { page: 'admin-users' },
    redirectOnAuthz: '/unauthorized'
  }
)
```

#### 2.3 Route Refactoring Checklist

**High Priority Routes (Refactor First):**
- [ ] `app/routes/api/data-quality.tsx` - Inconsistent error format, direct console.error
- [ ] `app/routes/admin/rate-limit-stats.tsx` - Inconsistent error format, direct console.error
- [ ] `app/routes/admin/audit-stats.tsx` - Inconsistent error format, direct console.error
- [ ] `app/routes/admin/security-stats.tsx` - Inconsistent error format, direct console.error
- [ ] `app/routes/admin/users.tsx` - Silent failure, direct console.error
- [ ] `app/routes/api/user-perfumes.tsx` - Check error handling patterns
- [ ] `app/routes/perfume.tsx` - Check error handling patterns
- [ ] `app/routes/api/user-alerts.$userId.tsx` - Check error handling patterns
- [ ] `app/routes/api/user-alerts.$userId.preferences.tsx` - Check error handling patterns

**Medium Priority Routes:**
- [ ] `app/routes/admin/EditPerfumePage.tsx` - Check error handling
- [ ] `app/routes/admin/security-monitor.tsx` - Check error handling
- [ ] `app/routes/api/houses-by-letter.ts` - Check error handling
- [ ] `app/routes/api.reviews.tsx` - Check error handling
- [ ] `app/routes/admin/profilePage.tsx` - Check error handling

**Audit Remaining Routes:**
```bash
# Find all route files
find app/routes -type f -name "*.tsx" -o -name "*.ts"

# Check each file for:
# 1. try/catch blocks
# 2. console.error usage
# 3. Error response formats
# 4. Use of centralized error handlers
```

---

### Step 3: Enhanced Error Logging (Priority 2)

#### 3.1 Replace Console.error with ErrorLogger

**Create Migration Script:**

```typescript
// scripts/migrate-console-errors.ts
import { readFileSync, writeFileSync } from 'fs'
import { glob } from 'glob'

const filesToMigrate = glob.sync('app/**/*.{ts,tsx}', {
  ignore: ['**/*.test.ts', '**/*.test.tsx', '**/node_modules/**']
})

filesToMigrate.forEach(file => {
  let content = readFileSync(file, 'utf8')
  
  // Check if file uses console.error
  if (!content.includes('console.error')) {
    return
  }

  // Add import if not present
  if (!content.includes('import') || !content.includes('ErrorLogger')) {
    // Find the first import statement or add at top
    const importMatch = content.match(/^import .* from .*$/m)
    if (importMatch) {
      content = content.replace(
        importMatch[0],
        `${importMatch[0]}\nimport { ErrorLogger } from '~/utils/errorHandling'`
      )
    } else {
      content = `import { ErrorLogger } from '~/utils/errorHandling'\n\n${content}`
    }
  }

  // Replace console.error patterns
  content = content.replace(
    /console\.error\((.*?)\)/g,
    'ErrorLogger.getInstance().logError($1)'
  )

  writeFileSync(file, content)
  console.log(`✅ Migrated: ${file}`)
})
```

**Manual Review Required:**
- Some console.error calls may need context added
- Error handler might need to be used instead
- Verify replacements are correct

#### 3.2 Enhance ErrorLogger for Production

**File:** `app/utils/errorHandling.ts`

**Add Production Logging:**
```typescript
export class ErrorLogger {
  private static instance: ErrorLogger
  private logs: ErrorLogEntry[] = []
  private logService?: ExternalLogService  // For production

  private constructor() {
    // Initialize external logging service in production
    if (process.env.NODE_ENV === 'production') {
      this.initializeProductionLogging()
    }
  }

  private initializeProductionLogging() {
    // Option 1: Sentry
    if (process.env.SENTRY_DSN) {
      // Initialize Sentry
      // this.logService = new SentryLogService()
    }
    
    // Option 2: Custom logging endpoint
    else if (process.env.LOG_ENDPOINT) {
      // this.logService = new CustomLogService(process.env.LOG_ENDPOINT)
    }
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  log(error: AppError, userId?: string): void {
    const logEntry = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId,
      error: {
        ...error.toJSON(),
        context: sanitizeContext(error.context)
      }
    }

    // Store in memory (for development and as fallback)
    this.logs.push(logEntry)
    if (this.logs.length > 1000) {
      this.logs.shift()
    }

    // Send to external service in production
    if (this.logService) {
      this.logService.send(logEntry).catch(err => {
        // Fallback: log to console if external service fails
        console.error('Failed to send error to logging service:', err)
      })
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorLogger]', logEntry)
    }
  }

  // ... rest of existing methods
}

interface ExternalLogService {
  send(logEntry: ErrorLogEntry): Promise<void>
}
```

---

### Step 4: Error Monitoring Integration (Priority 2)

#### 4.1 Sentry Integration (Recommended)

**Install:**
```bash
npm install @sentry/react @sentry/remix
```

**File:** `app/utils/errorMonitoring.server.ts`

```typescript
import * as Sentry from '@sentry/remix'

// Initialize Sentry (call this in entry.server.tsx)
export function initializeErrorMonitoring() {
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
      
      // Set release version
      release: process.env.APP_VERSION || 'unknown',

      // Breadcrumbs configuration
      integrations: [
        new Sentry.BrowserTracing(),
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // Filter sensitive data
      beforeSend(event, hint) {
        // Don't send events for certain errors
        const error = hint.originalException
        if (error instanceof Error) {
          // Don't report validation errors
          if (error.message.includes('VALIDATION_ERROR')) {
            return null
          }
        }

        // Scrub sensitive data from breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
            if (breadcrumb.data) {
              breadcrumb.data = sanitizeContext(breadcrumb.data)
            }
            return breadcrumb
          })
        }

        return event
      },
    })
  }
}

// Capture error with context
export function captureError(error: AppError, context?: Record<string, any>) {
  Sentry.captureException(error, {
    level: getSentryLevel(error.severity),
    tags: {
      errorType: error.type,
      errorCode: error.code,
    },
    contexts: {
      error: {
        ...sanitizeContext(context),
        userMessage: error.userMessage,
      },
    },
  })
}

function getSentryLevel(severity: ErrorSeverity): Sentry.SeverityLevel {
  const levelMap: Record<ErrorSeverity, Sentry.SeverityLevel> = {
    LOW: 'info',
    MEDIUM: 'warning',
    HIGH: 'error',
    CRITICAL: 'fatal',
  }
  return levelMap[severity] || 'error'
}
```

**Update ErrorLogger:**
```typescript
import { captureError } from './errorMonitoring.server'

export class ErrorLogger {
  log(error: AppError, userId?: string): void {
    // ... existing code ...

    // Send to Sentry in production
    if (process.env.NODE_ENV === 'production') {
      captureError(error, { userId, ...error.context })
    }
  }
}
```

#### 4.2 Add Correlation IDs

**File:** `app/utils/correlationId.server.ts`

```typescript
import { AsyncLocalStorage } from 'async_hooks'

const correlationIdStorage = new AsyncLocalStorage<string>()

export function generateCorrelationId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function setCorrelationId(id: string) {
  correlationIdStorage.enterWith(id)
}

export function getCorrelationId(): string | undefined {
  return correlationIdStorage.getStore()
}

// Middleware to set correlation ID
export function withCorrelationId(handler: Function) {
  return async (...args: any[]) => {
    const correlationId = generateCorrelationId()
    setCorrelationId(correlationId)
    return handler(...args)
  }
}
```

**Update entry.server.tsx:**
```typescript
import { generateCorrelationId, setCorrelationId } from './utils/correlationId.server'

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  // Generate and set correlation ID
  const correlationId = request.headers.get('X-Correlation-ID') || generateCorrelationId()
  setCorrelationId(correlationId)
  
  // Add to response headers
  responseHeaders.set('X-Correlation-ID', correlationId)
  
  // ... rest of handler
}
```

**Update ErrorLogger to include correlation ID:**
```typescript
import { getCorrelationId } from './correlationId.server'

export class ErrorLogger {
  log(error: AppError, userId?: string): void {
    const logEntry = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      correlationId: getCorrelationId(),  // Add correlation ID
      timestamp: new Date().toISOString(),
      userId,
      error: {
        ...error.toJSON(),
        context: sanitizeContext(error.context)
      }
    }
    // ... rest of logging
  }
}
```

---

### Step 5: User Experience Improvements (Priority 3)

#### 5.1 User-Friendly Error Messages

**File:** `app/utils/errorMessages.ts`

```typescript
/**
 * User-friendly error messages with recovery suggestions
 */
export const USER_ERROR_MESSAGES: Record<string, {
  title: string
  message: string
  suggestion: string
  action?: string
  actionText?: string
}> = {
  // Authentication Errors
  AUTH_ERROR: {
    title: 'Authentication Required',
    message: 'You need to be signed in to access this page.',
    suggestion: 'Please sign in to continue.',
    action: '/sign-in',
    actionText: 'Sign In'
  },
  AUTHZ_ERROR: {
    title: 'Access Denied',
    message: 'You don\'t have permission to access this resource.',
    suggestion: 'If you believe this is an error, please contact support.',
    action: '/',
    actionText: 'Go Home'
  },
  
  // Validation Errors
  VALIDATION_ERROR: {
    title: 'Invalid Input',
    message: 'Please check your input and try again.',
    suggestion: 'Make sure all required fields are filled in correctly.',
  },
  
  // Database Errors
  DB_ERROR: {
    title: 'Database Error',
    message: 'We\'re having trouble connecting to our servers.',
    suggestion: 'Please try again in a few moments. If the problem persists, contact support.',
    action: 'retry',
    actionText: 'Try Again'
  },
  
  // Network Errors
  NETWORK_ERROR: {
    title: 'Connection Error',
    message: 'We couldn\'t connect to our servers.',
    suggestion: 'Please check your internet connection and try again.',
    action: 'retry',
    actionText: 'Retry'
  },
  
  // Not Found Errors
  NOT_FOUND_ERROR: {
    title: 'Not Found',
    message: 'The page or resource you\'re looking for doesn\'t exist.',
    suggestion: 'It may have been moved or deleted.',
    action: '/',
    actionText: 'Go Home'
  },
  
  // Server Errors
  SERVER_ERROR: {
    title: 'Server Error',
    message: 'Something went wrong on our end.',
    suggestion: 'We\'re working on fixing it. Please try again later.',
    action: 'retry',
    actionText: 'Try Again'
  },
  
  // Generic Errors
  UNKNOWN_ERROR: {
    title: 'Unexpected Error',
    message: 'Something unexpected happened.',
    suggestion: 'Please try again. If the problem continues, contact support.',
    action: 'retry',
    actionText: 'Try Again'
  }
}

export function getUserErrorMessage(error: AppError) {
  return USER_ERROR_MESSAGES[error.code] || USER_ERROR_MESSAGES.UNKNOWN_ERROR
}
```

#### 5.2 Enhanced Error UI Component

**File:** `app/components/Organisms/ErrorDisplay/ErrorDisplay.tsx`

```typescript
import { Link } from 'react-router'
import { FiAlertCircle, FiRefreshCw, FiHome } from 'react-icons/fi'
import { AppError } from '~/utils/errorHandling'
import { getUserErrorMessage } from '~/utils/errorMessages'

interface ErrorDisplayProps {
  error: AppError
  onRetry?: () => void
  showDetails?: boolean
}

export function ErrorDisplay({ error, onRetry, showDetails = false }: ErrorDisplayProps) {
  const errorInfo = getUserErrorMessage(error)

  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 mb-6 text-red-500">
          <FiAlertCircle className="w-full h-full" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {errorInfo.title}
        </h2>

        {/* Message */}
        <p className="text-gray-600 mb-4">
          {errorInfo.message}
        </p>

        {/* Suggestion */}
        <p className="text-sm text-gray-500 mb-8">
          {errorInfo.suggestion}
        </p>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          {errorInfo.action === 'retry' && onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-6 py-3 bg-noir-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <FiRefreshCw />
              {errorInfo.actionText}
            </button>
          )}

          {errorInfo.action && errorInfo.action !== 'retry' && (
            <Link
              to={errorInfo.action}
              className="flex items-center gap-2 px-6 py-3 bg-noir-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <FiHome />
              {errorInfo.actionText}
            </Link>
          )}
        </div>

        {/* Technical Details (Development Only) */}
        {showDetails && process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Technical Details
            </summary>
            <pre className="mt-4 p-4 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(
                {
                  code: error.code,
                  type: error.type,
                  severity: error.severity,
                  message: error.message,
                  context: error.context,
                },
                null,
                2
              )}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
```

#### 5.3 Retry Mechanism

**File:** `app/utils/retry.ts`

```typescript
export interface RetryOptions {
  maxRetries?: number
  delay?: number
  backoff?: 'linear' | 'exponential'
  retryCondition?: (error: unknown) => boolean
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 'exponential',
    retryCondition = isRetryableError,
  } = options

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry if we've exhausted attempts
      if (attempt === maxRetries) {
        break
      }

      // Don't retry if error is not retryable
      if (!retryCondition(error)) {
        throw error
      }

      // Calculate delay
      const waitTime = backoff === 'exponential'
        ? delay * Math.pow(2, attempt)
        : delay * (attempt + 1)

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  throw lastError
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof AppError) {
    // Retry network errors and temporary server errors
    return error.type === 'NETWORK' || 
           (error.type === 'SERVER' && error.severity !== 'CRITICAL')
  }

  if (error instanceof Response) {
    // Retry 5xx errors except 501 (Not Implemented)
    return error.status >= 500 && error.status !== 501
  }

  return false
}
```

**Usage in hooks:**
```typescript
// app/hooks/useApiErrorHandler.ts
import { withRetry } from '~/utils/retry'

export const useApiWithRetry = () => {
  const { handleApiError } = useApiErrorHandler()

  const fetchWithRetry = useCallback(async <T>(
    fetchFn: () => Promise<T>,
    retryOptions?: RetryOptions
  ): Promise<T | null> => {
    try {
      return await withRetry(fetchFn, retryOptions)
    } catch (error) {
      handleApiError(error)
      return null
    }
  }, [handleApiError])

  return { fetchWithRetry }
}
```

---

## Testing Strategy

### 1. Unit Tests

**Test Files to Create:**
- `test/utils/errorHandling.server.test.ts` - Test ServerErrorHandler enhancements
- `test/utils/errorSanitization.test.ts` - Test context sanitization
- `test/utils/retry.test.ts` - Test retry mechanisms
- `test/utils/correlationId.test.ts` - Test correlation ID generation

**Key Test Scenarios:**
```typescript
describe('Error Handling Security', () => {
  describe('sanitizeContext', () => {
    it('should redact password fields', () => {
      const context = { password: 'secret123', username: 'user' }
      const sanitized = sanitizeContext(context)
      expect(sanitized.password).toBe('[REDACTED]')
      expect(sanitized.username).toBe('user')
    })

    it('should redact nested sensitive fields', () => {
      const context = {
        user: { password: 'secret', apiKey: 'key123' },
        data: { value: 'safe' }
      }
      const sanitized = sanitizeContext(context)
      expect(sanitized.user.password).toBe('[REDACTED]')
      expect(sanitized.user.apiKey).toBe('[REDACTED]')
      expect(sanitized.data.value).toBe('safe')
    })
  })

  describe('createErrorResponse', () => {
    it('should not expose stack traces in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      const error = createError.server('Test error')
      const response = createErrorResponse(error)
      const body = JSON.parse(await response.text())
      
      expect(body.error.stack).toBeUndefined()
      expect(body.error.message).toBe('Server error occurred')
      
      process.env.NODE_ENV = originalEnv
    })
  })
})

describe('Retry Mechanism', () => {
  it('should retry on network errors', async () => {
    let attempts = 0
    const fn = jest.fn(() => {
      attempts++
      if (attempts < 3) {
        throw createError.network('Network error')
      }
      return Promise.resolve('success')
    })

    const result = await withRetry(fn, { maxRetries: 3, delay: 10 })
    expect(result).toBe('success')
    expect(attempts).toBe(3)
  })

  it('should not retry on validation errors', async () => {
    const fn = jest.fn(() => {
      throw createError.validation('Invalid input')
    })

    await expect(withRetry(fn, { maxRetries: 3 })).rejects.toThrow()
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
```

### 2. Integration Tests

**Test route error handling:**
```typescript
// test/integration/routes/error-handling.test.ts
describe('Route Error Handling', () => {
  it('should handle database errors gracefully', async () => {
    // Mock database failure
    jest.spyOn(prisma.perfume, 'findMany').mockRejectedValueOnce(
      new Error('Connection timeout')
    )

    const response = await fetch('/api/perfumes')
    expect(response.status).toBe(500)
    
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error.message).toContain('database')
    expect(body.error.stack).toBeUndefined() // No stack in production
  })

  it('should include correlation ID in error response', async () => {
    const response = await fetch('/api/perfumes', {
      headers: { 'X-Correlation-ID': 'test-123' }
    })
    
    expect(response.headers.get('X-Correlation-ID')).toBe('test-123')
  })
})
```

### 3. E2E Tests

**Test user-facing error scenarios:**
```typescript
// test/e2e/error-handling.test.ts
test.describe('Error Handling UX', () => {
  test('should show user-friendly error message on network failure', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/perfumes', route => route.abort('failed'))
    
    await page.goto('/perfumes')
    
    // Check error message is user-friendly
    await expect(page.locator('text=Connection Error')).toBeVisible()
    await expect(page.locator('text=Please check your internet connection')).toBeVisible()
    
    // Check retry button is present
    const retryButton = page.locator('button:has-text("Retry")')
    await expect(retryButton).toBeVisible()
  })

  test('should not expose technical details to users', async ({ page }) => {
    // Trigger error
    await page.goto('/api/error-test')
    
    // Technical details should not be visible
    await expect(page.locator('text=stack trace')).not.toBeVisible()
    await expect(page.locator('text=Error:')).not.toBeVisible()
  })
})
```

---

## Success Metrics

### 1. Security Metrics

- [ ] ✅ **Zero exposed stack traces** in production responses
- [ ] ✅ **100% of sensitive data redacted** in error logs
- [ ] ✅ **All error responses use HTTPS** and proper cache headers
- [ ] ✅ **Security audit passing** with no critical vulnerabilities

### 2. Consistency Metrics

- [ ] ✅ **100% of routes using centralized error handlers**
- [ ] ✅ **Zero direct console.error calls** in production code
- [ ] ✅ **Consistent error response format** across all APIs
- [ ] ✅ **All errors logged with correlation IDs**

### 3. User Experience Metrics

- [ ] ✅ **User-friendly error messages** for all error types
- [ ] ✅ **Error recovery suggestions** on all error pages
- [ ] ✅ **Retry mechanisms** for transient failures
- [ ] ✅ **< 100ms overhead** for error handling

### 4. Monitoring Metrics

- [ ] ✅ **Production error monitoring** operational (Sentry/DataDog)
- [ ] ✅ **Error rate < 1%** of total requests
- [ ] ✅ **MTTR (Mean Time to Resolution) < 1 hour** for critical errors
- [ ] ✅ **Error alert notifications** configured and working

### 5. Code Quality Metrics

- [ ] ✅ **Test coverage > 90%** for error handling utilities
- [ ] ✅ **Documentation complete** for all error handling patterns
- [ ] ✅ **Developer guidelines published** and followed
- [ ] ✅ **Zero linter warnings** in error handling code

---

## Implementation Checklist

### Phase 1: Immediate Fixes (Day 1) - 8 hours

#### Security Hardening
- [ ] Add `sanitizeContext` function to remove sensitive data
- [ ] Update `createErrorResponse` to hide stack traces in production
- [ ] Add proper HTTP status code mapping
- [ ] Remove stack traces from all error responses
- [ ] Add cache headers to error responses (no-store)
- [ ] Test security with sample sensitive data
- [ ] Security audit with penetration testing tools

#### Silent Failure Fixes
- [ ] Audit all routes for silent failures (catch blocks with no error handling)
- [ ] Fix `app/routes/admin/users.tsx` silent failure
- [ ] Add error boundaries to all route components
- [ ] Test error propagation from loaders/actions

#### Console.error Migration
- [ ] Create console.error migration script
- [ ] Run migration on all route files
- [ ] Manual review of migrated files
- [ ] Test ErrorLogger in development
- [ ] Test ErrorLogger with external service (if configured)

### Phase 2: Standardization (Day 2) - 8 hours

#### Route Error Handling Utilities
- [ ] Create `withLoaderErrorHandling` wrapper
- [ ] Create `withActionErrorHandling` wrapper
- [ ] Add TypeScript types for wrappers
- [ ] Write unit tests for wrappers
- [ ] Document wrapper usage

#### Route Refactoring
- [ ] Refactor `app/routes/api/data-quality.tsx`
- [ ] Refactor `app/routes/admin/rate-limit-stats.tsx`
- [ ] Refactor `app/routes/admin/audit-stats.tsx`
- [ ] Refactor `app/routes/admin/security-stats.tsx`
- [ ] Refactor `app/routes/admin/users.tsx`
- [ ] Refactor `app/routes/api/user-perfumes.tsx`
- [ ] Refactor `app/routes/perfume.tsx`
- [ ] Refactor `app/routes/api/user-alerts.$userId.tsx`
- [ ] Refactor `app/routes/api/user-alerts.$userId.preferences.tsx`
- [ ] Test all refactored routes

#### Documentation
- [ ] Create error handling guidelines document
- [ ] Add examples for common error scenarios
- [ ] Document error response formats
- [ ] Add troubleshooting guide

### Phase 3: Enhanced Monitoring (Day 3) - 8 hours

#### External Monitoring Setup
- [ ] Choose monitoring service (Sentry recommended)
- [ ] Create Sentry account and project
- [ ] Install Sentry SDK
- [ ] Configure Sentry initialization
- [ ] Add Sentry to entry.server.tsx
- [ ] Test Sentry error capture
- [ ] Set up error alerting rules

#### Correlation IDs
- [ ] Create correlation ID utility
- [ ] Add correlation ID to entry.server.tsx
- [ ] Update ErrorLogger to include correlation IDs
- [ ] Add correlation ID to response headers
- [ ] Test correlation ID flow

#### Error Analytics
- [ ] Create error analytics dashboard
- [ ] Add error rate monitoring
- [ ] Add error type breakdown
- [ ] Add error severity tracking
- [ ] Set up automated reports

### Phase 4: User Experience (Day 4) - 8 hours

#### User-Friendly Messages
- [ ] Create `errorMessages.ts` with friendly messages
- [ ] Map all error codes to user messages
- [ ] Add recovery suggestions
- [ ] Add action buttons (retry, go home, etc.)
- [ ] Test all error messages

#### Enhanced Error UI
- [ ] Create `ErrorDisplay` component
- [ ] Add icons and styling
- [ ] Add retry functionality
- [ ] Add technical details toggle (dev only)
- [ ] Test error display on all error types
- [ ] Add accessibility features (ARIA labels, keyboard nav)

#### Retry Mechanisms
- [ ] Create `retry.ts` utility
- [ ] Implement exponential backoff
- [ ] Add retry condition logic
- [ ] Create `useApiWithRetry` hook
- [ ] Test retry on network failures
- [ ] Test retry limits

### Testing & Validation

#### Unit Tests
- [ ] Test `sanitizeContext` function
- [ ] Test `createErrorResponse` with production/dev modes
- [ ] Test `withLoaderErrorHandling` wrapper
- [ ] Test `withActionErrorHandling` wrapper
- [ ] Test retry mechanism
- [ ] Test correlation ID generation
- [ ] Achieve > 90% test coverage

#### Integration Tests
- [ ] Test route error handling end-to-end
- [ ] Test database error handling
- [ ] Test authentication error handling
- [ ] Test validation error handling
- [ ] Test correlation ID propagation
- [ ] Test external monitoring integration

#### E2E Tests
- [ ] Test user-facing error messages
- [ ] Test error recovery actions
- [ ] Test retry functionality
- [ ] Test error pages
- [ ] Test no technical details exposed
- [ ] Test accessibility

#### Performance Tests
- [ ] Measure error handling overhead
- [ ] Test ErrorLogger memory usage
- [ ] Test retry mechanism performance
- [ ] Ensure < 100ms overhead

### Deployment & Monitoring

#### Pre-Deployment
- [ ] Security audit passing
- [ ] All tests passing (unit, integration, e2e)
- [ ] Code review completed
- [ ] Documentation reviewed
- [ ] Staging environment tested

#### Deployment
- [ ] Deploy to staging
- [ ] Monitor error rates in staging
- [ ] Test error monitoring integration
- [ ] Deploy to production
- [ ] Monitor production error rates

#### Post-Deployment
- [ ] Verify error monitoring is working
- [ ] Check error alert notifications
- [ ] Monitor error rate metrics
- [ ] Review first 24 hours of error logs
- [ ] Create incident response plan

### Documentation & Training

- [ ] Update README with error handling section
- [ ] Create developer guidelines document
- [ ] Document common error scenarios
- [ ] Create troubleshooting guide
- [ ] Record training video (optional)
- [ ] Present to team (if applicable)

---

## Rollback Plan

### If Issues Arise

**Level 1 - Monitoring Issues:**
- Disable external monitoring temporarily
- Fall back to ErrorLogger only
- Debug monitoring integration

**Level 2 - Performance Issues:**
- Disable retry mechanisms
- Reduce error logging verbosity
- Investigate performance bottleneck

**Level 3 - Critical Issues:**
- Revert to previous error handling
- Keep security fixes (sanitization)
- Create hotfix for critical bugs

**Rollback Procedure:**
```bash
# 1. Revert git commits
git revert <commit-hash>

# 2. Or rollback to specific commit
git reset --hard <previous-commit>

# 3. Deploy rollback
npm run deploy

# 4. Monitor for stability
npm run monitor:errors
```

---

## Maintenance Plan

### Weekly Tasks
- [ ] Review error rates and trends
- [ ] Check error monitoring alerts
- [ ] Review top 10 errors
- [ ] Update error messages if needed

### Monthly Tasks
- [ ] Error analytics review meeting
- [ ] Update error handling documentation
- [ ] Audit new routes for error handling
- [ ] Review and update error recovery suggestions

### Quarterly Tasks
- [ ] Security audit of error handling
- [ ] Performance optimization review
- [ ] Update external monitoring integration
- [ ] Review and update error handling guidelines

---

## Resources

### Documentation
- [React Router Error Handling](https://reactrouter.com/en/main/route/error-boundary)
- [Sentry Documentation](https://docs.sentry.io/)
- [Error Handling Best Practices](https://www.joyent.com/node-js/production/design/errors)

### Tools
- [Sentry](https://sentry.io/) - Error monitoring (recommended)
- [DataDog](https://www.datadoghq.com/) - Alternative monitoring
- [LogRocket](https://logrocket.com/) - Session replay with errors

### Internal Docs
- `docs/CODE_QUALITY_IMPROVEMENTS.md` - Overall code quality plan
- `app/utils/errorHandling.ts` - Current error handling utilities
- `app/utils/errorHandling.server.ts` - Server-side error handling
- `app/components/Containers/ErrorBoundary/` - Error boundary components

---

## Conclusion

This error handling improvement plan addresses critical security, consistency, and user experience issues while maintaining backward compatibility and minimizing deployment risk.

**Key Outcomes:**
- ✅ Secure error handling (no exposed sensitive data)
- ✅ Consistent error patterns across all routes
- ✅ Production-ready error monitoring
- ✅ User-friendly error messages and recovery
- ✅ Comprehensive testing coverage
- ✅ Clear documentation and guidelines

**Timeline:** 3-4 days (24-32 hours)
**Risk:** Medium (well-tested infrastructure exists)
**Impact:** High (affects all users and developers)

---

**Document Version:** 1.0  
**Last Updated:** October 29, 2025  
**Status:** Ready for Implementation  
**Approver:** [Pending]

