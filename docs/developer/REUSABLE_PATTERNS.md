# Reusable Patterns Guide

**Last Updated:** November 1, 2025

## Overview

This guide documents all reusable patterns, utilities, and best practices available in the Voodoo Perfumes application. These patterns help maintain consistency, reduce code duplication, and improve developer productivity across the codebase.

## Table of Contents

1. [Error Handling Patterns](#error-handling-patterns)
2. [Validation Patterns](#validation-patterns)
3. [Form Utilities](#form-utilities)
4. [Data Fetching Patterns](#data-fetching-patterns)
5. [Best Practices](#best-practices)
6. [Quick Reference](#quick-reference)

---

## Error Handling Patterns

### Overview

Standardized error handling patterns for consistent error management across the application.

**Location:** `app/utils/errorHandling.patterns.ts`

### Key Features

#### 1. Standardized Wrappers

Handle errors automatically in different contexts:

```typescript
import {
  withLoaderErrorHandling,
  withActionErrorHandling,
  withDatabaseErrorHandling,
  withApiErrorHandling,
  withValidationErrorHandling,
} from "~/utils/errorHandling.patterns"

// Route Loader
export const loader = withLoaderErrorHandling(
  async ({ request, params }) => {
    const data = await fetchData(params.id)
    return json(data)
  },
  { context: { route: "my-route", operation: "fetchData" } }
)

// Route Action
export const action = withActionErrorHandling(
  async ({ request }) => {
    const formData = await request.formData()
    await saveData(formData)
    return redirect("/success")
  },
  { context: { action: "save-data" } }
)

// Database Operation
async function getUser(id: string) {
  return withDatabaseErrorHandling(
    async () => await prisma.user.findUnique({ where: { id } }),
    { operation: "getUser", context: { id } }
  )
}

// API Call
async function fetchExternalData() {
  return withApiErrorHandling(
    async () => await fetch("/external/api").then((r) => r.json()),
    { api: "external-service" }
  )
}

// Validation
function validateUserData(data: unknown) {
  return withValidationErrorHandling(() => userSchema.parse(data), {
    schema: "user",
    data,
  })
}
```

#### 2. Result Pattern Utilities

Non-throwing alternatives for predictable error handling:

```typescript
import { safeAsync, safeSync } from "~/utils/errorHandling.patterns"

// Async operations
const [error, user] = await safeAsync(() => getUser(id))
if (error) {
  console.error("Failed to get user:", error.message)
  return defaultUser
}
// Use user safely here

// Sync operations
const [parseError, data] = safeSync(() => JSON.parse(jsonString))
if (parseError) {
  return fallbackData
}
```

#### 3. Assertion Helpers

Throw standardized errors when conditions aren't met:

```typescript
import {
  assertExists,
  assertValid,
  assertAuthenticated,
  assertAuthorized,
} from "~/utils/errorHandling.patterns"

// Check existence (throws notFoundError if null/undefined)
const userId = assertExists(params.userId, "User ID", { params })
const user = assertExists(await getUser(userId), "User", { userId })

// Validate conditions (throws validationError if false)
assertValid(
  typeof email === "string" && email.includes("@"),
  "Valid email is required",
  { field: "email", value: email }
)

// Check authentication (throws authenticationError if not authenticated)
const session = assertAuthenticated(
  await getSession(request),
  "You must be logged in"
)

// Check authorization (throws authorizationError if not authorized)
assertAuthorized(
  user.role === "admin",
  "You must be an admin to perform this action",
  { userId: user.id, requiredRole: "admin" }
)
```

#### 4. Error Factory Functions

Create standardized errors with proper typing:

```typescript
import {
  notFoundError,
  validationError,
  authenticationError,
  authorizationError,
  databaseError,
  networkError,
} from "~/utils/errorHandling.patterns"

// Not found error
throw notFoundError("User not found", { userId })

// Validation error
throw validationError("Invalid email format", {
  field: "email",
  value: email,
})

// Authentication error
throw authenticationError("Session expired")

// Authorization error
throw authorizationError("Insufficient permissions", {
  requiredRole: "admin",
  userRole: "user",
})

// Database error
throw databaseError("Failed to connect to database", {
  operation: "connect",
})

// Network error
throw networkError("External API unavailable", {
  api: "stripe",
  statusCode: 503,
})
```

#### 5. Advanced Features

```typescript
import { withRetry } from "~/utils/errorHandling.patterns"

// Retry logic with exponential backoff
const data = await withRetry(async () => await fetchExternalAPI(), {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  onRetry: (attempt, error) => {
    console.log(`Retry attempt ${attempt}:`, error.message)
  },
})
```

### Benefits

- ✅ Consistent error handling across the application
- ✅ Reduced boilerplate code
- ✅ Better error messages with context
- ✅ Type-safe error handling
- ✅ Improved error logging and tracking
- ✅ Easier debugging with detailed context
- ✅ 38 comprehensive tests (100% passing)

### Testing

**Location:** `app/utils/errorHandling.patterns.test.ts`

Run tests:

```bash
npm test -- app/utils/errorHandling.patterns.test.ts
```

---

## Validation Patterns

### Overview

Comprehensive validation utilities with Zod schemas for consistent data validation across the application.

**Location:** `app/utils/validation/`

### Key Features

#### 1. Organized Schemas

All validation schemas organized by domain:

```typescript
import { validationSchemas } from "~/utils/validation"

// Access schemas by category
const userSchema = validationSchemas.auth.signup
const perfumeSchema = validationSchemas.perfume.create
const emailSchema = validationSchemas.common.email
```

#### 2. Common Schemas

Reusable primitive schemas:

```typescript
import { commonSchemas } from "~/utils/validation"

// Primitive validation
commonSchemas.id // UUID validation
commonSchemas.email // Email format
commonSchemas.password // Password strength
commonSchemas.username // Username format
commonSchemas.url // URL format
commonSchemas.phone // Phone number
commonSchemas.rating // 1-5 star rating
commonSchemas.year // Year (1900-2099)
commonSchemas.page // Pagination page (1+)
commonSchemas.limit // Pagination limit (1-100)
commonSchemas.boolean // Boolean or string boolean
```

#### 3. Domain-Specific Schemas

Organized by business domain:

```typescript
import {
  authSchemas,
  perfumeSchemas,
  perfumeHouseSchemas,
  ratingSchemas,
  commentSchemas,
  wishlistSchemas,
  apiSchemas,
  adminSchemas,
} from "~/utils/validation"

// Authentication
authSchemas.signup
authSchemas.login
authSchemas.changePassword
authSchemas.forgotPassword
authSchemas.resetPassword
authSchemas.updateProfile

// Perfumes
perfumeSchemas.create
perfumeSchemas.update
perfumeSchemas.updateUserPerfume
perfumeSchemas.search

// Perfume Houses
perfumeHouseSchemas.create
perfumeHouseSchemas.update

// Ratings
ratingSchemas.create
ratingSchemas.update

// Comments
commentSchemas.create
commentSchemas.update

// Wishlist
wishlistSchemas.add
wishlistSchemas.remove
wishlistSchemas.update

// API
apiSchemas.pagination
apiSchemas.search
apiSchemas.filter

// Admin
adminSchemas.userManagement
adminSchemas.dataQualityReport
```

#### 4. Validation Helper Functions

Utilities for common validation tasks:

```typescript
import {
  validateData,
  validateFormData,
  validateJsonData,
  sanitizeString,
  sanitizeObject,
  validateAndTransform,
  validateEmail,
  validatePassword,
  validateUrl,
  validatePagination,
} from "~/utils/validation"

// Validate any data against a schema
const result = validateData(mySchema, data)
if (!result.success) {
  console.error(result.errors)
  return
}
const validData = result.data

// Validate form data from a request
const formResult = await validateFormData(mySchema, request)
if (!formResult.success) {
  return json({ errors: formResult.errors }, { status: 400 })
}

// Validate JSON data
const jsonResult = validateJsonData(mySchema, jsonString)

// Sanitize strings (remove XSS threats)
const clean = sanitizeString('<script>alert("xss")</script>Hello')
// Returns: 'Hello'

// Sanitize objects
const cleanData = sanitizeObject({
  name: "John",
  bio: "<script>bad</script>Good bio",
})
// Returns: { name: 'John', bio: 'Good bio' }

// Validate with transformation
const { data, errors } = validateAndTransform(userSchema, formData, (valid) => ({
  ...valid,
  createdAt: new Date(),
}))

// Field validators
const isValidEmail = validateEmail("user@example.com")
const passwordResult = validatePassword("SecureP@ss123", {
  minLength: 8,
  requireNumbers: true,
  requireSpecialChars: true,
})
const isValidUrl = validateUrl("https://example.com")

// Pagination validation
const { page, limit, offset } = validatePagination(
  { page: "2", limit: "20" },
  { maxLimit: 100 }
)
```

### Usage Examples

#### Route Loader Validation

```typescript
import { withLoaderErrorHandling } from "~/utils/errorHandling.patterns"
import { apiSchemas, assertValid } from "~/utils/validation"

export const loader = withLoaderErrorHandling(
  async ({ request }) => {
    const url = new URL(request.url)
    const params = Object.fromEntries(url.searchParams)

    // Validate pagination params
    const { page, limit } = apiSchemas.pagination.parse(params)

    const data = await getPaginatedData(page, limit)
    return json(data)
  },
  { context: { route: "paginated-list" } }
)
```

#### Route Action Validation

```typescript
import { withActionErrorHandling } from "~/utils/errorHandling.patterns"
import { perfumeSchemas, validateFormData } from "~/utils/validation"

export const action = withActionErrorHandling(
  async ({ request }) => {
    const formData = await request.formData()

    // Validate form data
    const result = await validateFormData(perfumeSchemas.create, formData)
    if (!result.success) {
      return json({ errors: result.errors }, { status: 400 })
    }

    const perfume = await createPerfume(result.data)
    return redirect(`/perfume/${perfume.id}`)
  },
  { context: { action: "create-perfume" } }
)
```

#### Component Validation

```typescript
import { authSchemas } from "~/utils/validation"

function SignUpForm() {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)

    // Validate on client side
    const result = authSchemas.signup.safeParse(data)
    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors)
      return
    }

    // Submit valid data
    await fetch("/api/signup", {
      method: "POST",
      body: JSON.stringify(result.data),
    })
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

### Benefits

- ✅ Single source of truth for validation
- ✅ Eliminated ~400 lines of duplicate code
- ✅ Type-safe with full TypeScript support
- ✅ Organized by domain for easy discovery
- ✅ Built-in XSS protection with sanitization
- ✅ Comprehensive error messages
- ✅ 90+ comprehensive tests (100% passing)

### Testing

**Locations:**

- `app/utils/validation/schemas.ts` (Schema definitions)
- `app/utils/validation/schemas.test.ts` (Schema tests)
- `app/utils/validation/index.ts` (Helper functions)
- `app/utils/validation/index.test.ts` (Helper function tests)

Run tests:

```bash
npm test -- app/utils/validation/
```

---

## Form Utilities

### Overview

Reusable form handling utilities to reduce duplication and improve consistency.

**Location:** `app/utils/forms/`

**Documentation:** `app/utils/forms/README.md`

### Key Features

#### 1. Form Submission Hook

Client-side form handling with validation and error handling:

```typescript
import { useFormSubmit, createValidator, commonValidators } from "~/utils/forms"

function LoginForm() {
  const { handleSubmit, isSubmitting, errors, clearErrors } =
    useFormSubmit<LoginData>({
      validate: createValidator({
        email: commonValidators.email,
        password: commonValidators.required("Password"),
      }),
      onSuccess: (result) => navigate("/dashboard"),
      onError: (error) => console.error(error),
      resetOnSuccess: true,
    })

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        return await loginUser(data)
      })}
    >
      <input type="email" name="email" />
      {errors.email && <span>{errors.email}</span>}

      <input type="password" name="password" />
      {errors.password && <span>{errors.password}</span>}

      {errors._form && <div>{errors._form}</div>}

      <button disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Login"}
      </button>
    </form>
  )
}
```

#### 2. Common Validators

Pre-built validators for common use cases:

```typescript
import { commonValidators, createValidator } from "~/utils/forms"

const validate = createValidator({
  email: commonValidators.email,
  password: commonValidators.password,
  confirmPassword: commonValidators.confirmPassword("password"),
  username: commonValidators.required("Username"),
  bio: commonValidators.maxLength("Bio", 500),
  age: commonValidators.minValue("Age", 18),
})
```

Available validators:

- `email` - Email format validation
- `password` - Password strength validation
- `confirmPassword(field)` - Password confirmation matching
- `required(fieldName)` - Required field validation
- `minLength(fieldName, min)` - Minimum length validation
- `maxLength(fieldName, max)` - Maximum length validation
- `minValue(fieldName, min)` - Minimum value validation
- `maxValue(fieldName, max)` - Maximum value validation

#### 3. Form Action Wrapper

Type-safe wrapper for Remix actions:

```typescript
import { createFormAction } from "~/utils/forms"

export const action = createFormAction(
  async (data: FormData) => {
    const user = await createUser(data)
    return redirect(`/user/${user.id}`)
  },
  {
    validate: (data) => {
      if (!data.email) return { error: "Email is required" }
      return null
    },
    transform: (formData) => ({
      email: formData.get("email"),
      password: formData.get("password"),
    }),
  }
)
```

#### 4. Helper Functions

```typescript
import {
  extractFormData,
  formDataToObject,
  sanitizeFormInput,
  sanitizeFormData,
  validateEmail,
  validatePassword,
  validateMatch,
} from "~/utils/forms"

// Extract specific fields
const data = extractFormData<{ email: string; password: string }>(formData, [
  "email",
  "password",
])

// Convert FormData to object
const obj = formDataToObject(formData)

// Sanitize input (XSS protection)
const clean = sanitizeFormInput('<script>alert("xss")</script>')
const cleanData = sanitizeFormData(formData)

// Validate email
if (!validateEmail(email)) {
  setError("Invalid email")
}

// Validate password strength
const result = validatePassword(password, {
  minLength: 10,
  requireSpecialChars: true,
})
if (!result.valid) {
  setError(result.message)
}

// Validate field matching
const error = validateMatch(password, confirmPassword, "Passwords")
if (error) {
  setError(error)
}
```

### Benefits

- ✅ Reduced boilerplate code
- ✅ Consistent error handling
- ✅ Type safety with TypeScript generics
- ✅ Built-in XSS protection
- ✅ Reusable validation logic
- ✅ 49 comprehensive tests (100% passing)

### Testing

Run tests:

```bash
npm test -- test/unit/utils/formSubmit.test.ts test/unit/utils/formValidation.test.ts
```

---

## Data Fetching Patterns

### Overview

Consolidated data fetching utilities for consistent data loading, error handling, caching, and pagination.

**Location:** `app/utils/data-fetching/`

### Key Features

#### 1. Data Fetching Hook

Simple data fetching with loading and error states:

```typescript
import { useDataFetching } from "~/utils/data-fetching"

function UserList() {
  const { data, isLoading, error, refetch } = useDataFetching<User[]>({
    url: "/api/users",
    options: {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  })

  if (isLoading) return <Loading />
  if (error) return <Error message={error.message} />

  return (
    <div>
      {data?.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
      <button onClick={refetch}>Refresh</button>
    </div>
  )
}
```

#### 2. Paginated Data Hook

Handle paginated data easily:

```typescript
import { usePaginatedData } from "~/utils/data-fetching"

function PerfumeList() {
  const { data, isLoading, error, nextPage, prevPage, goToPage, meta } =
    usePaginatedData<Perfume>({
      baseUrl: "/api/perfumes",
      pageSize: 20,
      initialPage: 1,
    })

  return (
    <div>
      {data?.map((perfume) => (
        <PerfumeCard key={perfume.id} perfume={perfume} />
      ))}

      <Pagination
        currentPage={meta.currentPage}
        totalPages={meta.totalPages}
        onNext={nextPage}
        onPrev={prevPage}
        onGoTo={goToPage}
      />
    </div>
  )
}
```

#### 3. API with Retry

Automatic retry logic for unreliable APIs:

```typescript
import { useApiWithRetry } from "~/utils/data-fetching"

function ExternalData() {
  const { data, isLoading, error, retry } = useApiWithRetry<ApiData>({
    fetchFn: () => fetch("/external/api").then((r) => r.json()),
    maxAttempts: 3,
    initialDelay: 1000,
    onRetry: (attempt) => {
      console.log(`Retry attempt ${attempt}`)
    },
  })

  if (error) {
    return <button onClick={retry}>Retry</button>
  }

  return <div>{data && <DisplayData data={data} />}</div>
}
```

#### 4. Utility Functions

```typescript
import {
  buildQueryString,
  withCache,
  parseApiResponse,
  createFetchFn,
  retryFetch,
  clearAllCache,
  getCacheStats,
} from "~/utils/data-fetching"

// Build query strings
const url = buildQueryString("/api/perfumes", {
  type: "niche",
  page: 1,
  limit: 20,
})
// Returns: '/api/perfumes?type=niche&page=1&limit=20'

// Cache wrapper
const cachedFetch = withCache(
  () => fetch("/api/data").then((r) => r.json()),
  "my-cache-key",
  300000 // 5 minutes
)

// Parse API responses
const data = await parseApiResponse<User[]>(fetch("/api/users"))

// Create custom fetch function
const apiFetch = createFetchFn({
  baseUrl: "/api",
  headers: { "X-Custom-Header": "value" },
  credentials: "include",
})
const users = await apiFetch<User[]>("/users")

// Retry with exponential backoff
const data = await retryFetch(() => fetch("/api/data").then((r) => r.json()), {
  maxAttempts: 3,
  initialDelay: 1000,
})

// Cache management
clearAllCache()
const stats = getCacheStats()
console.log(`Cached items: ${stats.count}, Total size: ${stats.totalSize}`)
```

#### 5. Debounced Search

Optimize search queries:

```typescript
import { useDebouncedSearch } from "~/utils/data-fetching"

function SearchBar() {
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebouncedSearch(query, 300)

  const { data, isLoading } = useDataFetching<SearchResult[]>({
    url: `/api/search?q=${debouncedQuery}`,
    enabled: debouncedQuery.length > 2,
  })

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      {isLoading && <Spinner />}
      {data && <ResultsList results={data} />}
    </div>
  )
}
```

### Benefits

- ✅ Consistent data fetching patterns
- ✅ Built-in loading and error states
- ✅ Automatic caching support
- ✅ Pagination made easy
- ✅ Retry logic with exponential backoff
- ✅ Request cancellation support
- ✅ Type-safe with TypeScript
- ✅ Performance optimized

---

## Best Practices

### 1. Error Handling

**DO:**

```typescript
// Use standardized wrappers
export const loader = withLoaderErrorHandling(async () => await getData(), {
  context: { route: "my-route" },
})

// Use assertion helpers
const user = assertExists(await getUser(id), "User", { id })

// Use result pattern for optional operations
const [error, data] = await safeAsync(() => tryOperation())
```

**DON'T:**

```typescript
// Don't use plain try-catch everywhere
try {
  const data = await getData()
  return json(data)
} catch (error) {
  return json({ error: "Something went wrong" }, { status: 500 })
}

// Don't throw generic errors
if (!user) {
  throw new Error("User not found")
}
```

### 2. Validation

**DO:**

```typescript
// Use organized schemas
import { perfumeSchemas } from "~/utils/validation"
const result = perfumeSchemas.create.safeParse(data)

// Validate at boundaries (routes, API endpoints)
const result = await validateFormData(schema, formData)

// Sanitize user input
const clean = sanitizeString(userInput)
```

**DON'T:**

```typescript
// Don't duplicate validation logic
if (!email || !email.includes("@")) {
  throw new Error("Invalid email")
}

// Don't skip validation
const user = await createUser(data) // data not validated!

// Don't trust user input
const html = `<div>${userInput}</div>` // XSS risk!
```

### 3. Forms

**DO:**

```typescript
// Use form utilities
const { handleSubmit, isSubmitting, errors } = useFormSubmit({
  validate: createValidator({
    email: commonValidators.email,
  }),
})

// Sanitize form data
const clean = sanitizeFormData(formData)
```

**DON'T:**

```typescript
// Don't reinvent form handling
const [loading, setLoading] = useState(false)
const [errors, setErrors] = useState({})
const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  // ... manual handling ...
}
```

### 4. Data Fetching

**DO:**

```typescript
// Use data fetching hooks
const { data, isLoading, error } = useDataFetching<User[]>({
  url: "/api/users",
})

// Cache expensive operations
const cachedFetch = withCache(fetchFn, "cache-key", 300000)

// Use pagination for large datasets
const { data, nextPage, meta } = usePaginatedData({
  baseUrl: "/api/items",
  pageSize: 20,
})
```

**DON'T:**

```typescript
// Don't fetch data manually every time
const [data, setData] = useState(null)
const [loading, setLoading] = useState(false)
useEffect(() => {
  setLoading(true)
  fetch("/api/data")
    .then((r) => r.json())
    .then(setData)
    .finally(() => setLoading(false))
}, [])
```

### 5. Type Safety

**DO:**

```typescript
// Define interfaces for your data structures
interface User {
  id: string
  email: string
  name: string
}

// Use generics for type safety
const { data } = useDataFetching<User[]>({ url: '/api/users' })
const { handleSubmit } = useFormSubmit<LoginData>({ ... })

// Infer types from schemas
type CreatePerfumeInput = z.infer<typeof perfumeSchemas.create>
```

**DON'T:**

```typescript
// Don't use 'any'
const data: any = await fetchData()
const result: any = schema.parse(data)
```

---

## Quick Reference

### Error Handling

```typescript
// Wrappers
withLoaderErrorHandling()
withActionErrorHandling()
withDatabaseErrorHandling()
withApiErrorHandling()
withValidationErrorHandling()

// Result Pattern
safeAsync()
safeSync()

// Assertions
assertExists()
assertValid()
assertAuthenticated()
assertAuthorized()

// Error Factories
notFoundError()
validationError()
authenticationError()
authorizationError()
databaseError()
networkError()

// Retry
withRetry()
```

### Validation

```typescript
// Schemas
commonSchemas.*
authSchemas.*
perfumeSchemas.*
ratingSchemas.*
apiSchemas.*

// Helpers
validateData()
validateFormData()
validateJsonData()
sanitizeString()
sanitizeObject()
validateEmail()
validatePassword()
validateUrl()
```

### Forms

```typescript
// Hooks
useFormSubmit()

// Validators
commonValidators.email
commonValidators.password
commonValidators.required()
commonValidators.minLength()
commonValidators.maxLength()

// Helpers
createValidator()
extractFormData()
formDataToObject()
sanitizeFormInput()
```

### Data Fetching

```typescript
// Hooks
useDataFetching()
usePaginatedData()
useApiWithRetry()
useDebouncedSearch()

// Utilities
buildQueryString()
withCache()
parseApiResponse()
createFetchFn()
retryFetch()
clearAllCache()
```

---

## Migration Guide

### Migrating to Error Handling Patterns

**Before:**

```typescript
export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const data = await getData(params.id)
    return json(data)
  } catch (error) {
    return json({ error: "Failed to load data" }, { status: 500 })
  }
}
```

**After:**

```typescript
export const loader = withLoaderErrorHandling(
  async ({ params }) => {
    const data = await getData(params.id)
    return json(data)
  },
  { context: { route: "my-route", operation: "getData" } }
)
```

### Migrating to Validation Patterns

**Before:**

```typescript
if (!email || typeof email !== "string" || !email.includes("@")) {
  throw new Error("Invalid email")
}
```

**After:**

```typescript
import { commonSchemas, assertValid } from "~/utils/validation"

const validEmail = commonSchemas.email.parse(email)
// or
assertValid(commonSchemas.email.safeParse(email).success, "Invalid email", {
  field: "email",
  value: email,
})
```

### Migrating to Form Utilities

**Before:**

```typescript
const [loading, setLoading] = useState(false)
const [errors, setErrors] = useState<Record<string, string>>({})

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setErrors({})

  const formData = new FormData(e.currentTarget as HTMLFormElement)
  const email = formData.get("email")

  if (!email) {
    setErrors({ email: "Email is required" })
    setLoading(false)
    return
  }

  try {
    await submitForm(formData)
    navigate("/success")
  } catch (error) {
    setErrors({ _form: "Submission failed" })
  } finally {
    setLoading(false)
  }
}
```

**After:**

```typescript
const { handleSubmit, isSubmitting, errors } = useFormSubmit<FormData>({
  validate: createValidator({
    email: commonValidators.email
  }),
  onSuccess: () => navigate('/success')
})

// In JSX
<form onSubmit={handleSubmit(async (data) => await submitForm(data))}>
```

---

## Additional Resources

- **Error Handling Tests:** `app/utils/errorHandling.patterns.test.ts`
- **Validation Tests:** `app/utils/validation/*.test.ts`
- **Form Tests:** `test/unit/utils/formSubmit.test.ts`, `test/unit/utils/formValidation.test.ts`
- **Forms Documentation:** `app/utils/forms/README.md`
- **Data Fetching:** `app/utils/data-fetching/index.ts` (with inline documentation)

## Support

For questions or issues with these patterns:

1. Review this documentation
2. Check the test files for usage examples
3. Read inline documentation in source files
4. Consult with the development team

---

**Last Updated:** November 1, 2025  
**Version:** 1.0.0
