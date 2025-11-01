# Error Handling - Common Scenarios

**Last Updated:** October 31, 2025

This document provides ready-to-use code examples for common error handling scenarios in the New Smell application.

## Table of Contents

- [User Authentication & Authorization](#user-authentication--authorization)
- [Form Validation & Submission](#form-validation--submission)
- [Database Operations](#database-operations)
- [API Calls & External Services](#api-calls--external-services)
- [File Uploads & Processing](#file-uploads--processing)
- [Real-time Features](#real-time-features)
- [Admin Operations](#admin-operations)

## User Authentication & Authorization

### Scenario 1: User Login

```typescript
// app/routes/login.tsx
import { withActionErrorHandling } from "~/utils/errorHandling.server"
import { createError } from "~/utils/errorHandling"
import { verifyLogin } from "~/utils/auth.server"

export const action = withActionErrorHandling(async ({ request }) => {
  const formData = await request.formData()
  const email = formData.get("email")
  const password = formData.get("password")

  // Validation
  if (!email || typeof email !== "string") {
    throw createError.validation("Email is required", {
      field: "email",
    })
  }

  if (!password || typeof password !== "string") {
    throw createError.validation("Password is required", {
      field: "password",
    })
  }

  // Authentication
  try {
    const user = await verifyLogin(email, password)

    if (!user) {
      throw createError.authentication("Invalid email or password", {
        email, // Will be sanitized in logs
      })
    }

    // Create session and redirect
    return createUserSession(user.id, "/dashboard")
  } catch (error) {
    if (error instanceof AppError) throw error

    throw createError.server("Login system error", {
      originalError: error,
    })
  }
})
```

### Scenario 2: Protected Route Access

```typescript
// app/routes/admin/users.tsx
import { withLoaderErrorHandling } from "~/utils/errorHandling.server"
import { createError } from "~/utils/errorHandling"
import { requireUserId } from "~/utils/auth.server"

export const loader = withLoaderErrorHandling(async ({ request }) => {
  // Check authentication
  const userId = await requireUserId(request)
  if (!userId) {
    throw createError.authentication("Please sign in to continue", {
      redirectTo: "/login",
      returnUrl: new URL(request.url).pathname,
    })
  }

  // Check authorization
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (!user) {
    throw createError.authentication("User session invalid")
  }

  if (user.role !== "ADMIN") {
    throw createError.authorization("Admin access required", {
      currentRole: user.role,
      requiredRole: "ADMIN",
      userId,
    })
  }

  // User is authenticated and authorized
  const users = await db.user.findMany()
  return json({ users })
})
```

### Scenario 3: Session Validation

```typescript
// app/utils/session.server.ts
import { createError } from "~/utils/errorHandling"

export async function getUserSession(request: Request) {
  const cookie = request.headers.get("Cookie")
  if (!cookie) {
    throw createError.authentication("No session cookie found")
  }

  try {
    const session = await sessionStorage.getSession(cookie)
    const userId = session.get("userId")

    if (!userId) {
      throw createError.authentication("Invalid session")
    }

    // Check if session is expired
    const expiresAt = session.get("expiresAt")
    if (expiresAt && new Date(expiresAt) < new Date()) {
      throw createError.authentication("Session expired", {
        expiredAt: expiresAt,
      })
    }

    return { userId, session }
  } catch (error) {
    if (error instanceof AppError) throw error

    throw createError.server("Session validation failed", {
      originalError: error,
    })
  }
}
```

## Form Validation & Submission

### Scenario 4: Multi-field Form Validation

```typescript
// app/routes/perfume/new.tsx
import { withActionErrorHandling } from "~/utils/errorHandling.server"
import { createError } from "~/utils/errorHandling"
import { z } from "zod"

const perfumeSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  brand: z.string().min(1, "Brand is required"),
  year: z.number().min(1900).max(new Date().getFullYear()),
  price: z.number().positive("Price must be positive"),
})

export const action = withActionErrorHandling(async ({ request }) => {
  const formData = await request.formData()

  const rawData = {
    name: formData.get("name"),
    brand: formData.get("brand"),
    year: Number(formData.get("year")),
    price: Number(formData.get("price")),
  }

  // Validate with Zod
  try {
    const validData = perfumeSchema.parse(rawData)

    // Create perfume
    const perfume = await db.perfume.create({
      data: validData,
    })

    return json({ success: true, perfume })
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Convert Zod errors to user-friendly messages
      const fieldErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }))

      throw createError.validation("Form validation failed", {
        fields: fieldErrors,
        submittedData: rawData, // Will be sanitized
      })
    }

    throw createError.server("Form submission failed", {
      originalError: error,
    })
  }
})
```

### Scenario 5: File Upload with Validation

```typescript
// app/routes/profile/avatar.tsx
import { withActionErrorHandling } from "~/utils/errorHandling.server"
import { createError } from "~/utils/errorHandling"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

export const action = withActionErrorHandling(async ({ request }) => {
  const formData = await request.formData()
  const file = formData.get("avatar") as File

  // Validation
  if (!file) {
    throw createError.validation("No file uploaded", {
      field: "avatar",
    })
  }

  if (file.size > MAX_FILE_SIZE) {
    throw createError.validation("File too large", {
      field: "avatar",
      maxSize: MAX_FILE_SIZE,
      actualSize: file.size,
      maxSizeMB: MAX_FILE_SIZE / (1024 * 1024),
    })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw createError.validation("Invalid file type", {
      field: "avatar",
      allowedTypes: ALLOWED_TYPES,
      actualType: file.type,
    })
  }

  try {
    // Process file upload
    const buffer = await file.arrayBuffer()
    const result = await uploadToStorage(buffer, file.name)

    return json({ success: true, url: result.url })
  } catch (error) {
    throw createError.server("File upload failed", {
      fileName: file.name,
      fileSize: file.size,
      originalError: error,
    })
  }
})
```

## Database Operations

### Scenario 6: Creating Record with Unique Constraint

```typescript
// app/models/user.server.ts
import { createError } from "~/utils/errorHandling"
import { Prisma } from "@prisma/client"

export async function createUser(data: CreateUserData) {
  try {
    return await db.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash: data.passwordHash,
      },
    })
  } catch (error) {
    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Unique constraint violation
      if (error.code === "P2002") {
        const field = error.meta?.target as string[]
        throw createError.validation(`${field?.[0] || "Field"} already exists`, {
          field: field?.[0],
          value: data[field?.[0] as keyof typeof data],
        })
      }

      // Foreign key constraint violation
      if (error.code === "P2003") {
        throw createError.validation("Invalid reference", {
          field: error.meta?.field_name,
        })
      }
    }

    // Generic database error
    throw createError.database("Failed to create user", {
      operation: "create",
      table: "user",
      originalError: error,
    })
  }
}
```

### Scenario 7: Transaction with Rollback

```typescript
// app/models/order.server.ts
import { createError } from "~/utils/errorHandling"

export async function createOrderWithItems(orderData: OrderData) {
  try {
    return await db.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          userId: orderData.userId,
          total: orderData.total,
        },
      })

      // Create order items
      for (const item of orderData.items) {
        // Check inventory
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        })

        if (!product) {
          throw createError.notFound("Product not found", {
            productId: item.productId,
          })
        }

        if (product.stock < item.quantity) {
          throw createError.validation("Insufficient stock", {
            productId: item.productId,
            requested: item.quantity,
            available: product.stock,
          })
        }

        // Create order item
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: product.price,
          },
        })

        // Update inventory
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: product.stock - item.quantity },
        })
      }

      return order
    })
  } catch (error) {
    if (error instanceof AppError) throw error

    throw createError.database("Order creation failed", {
      operation: "transaction",
      originalError: error,
    })
  }
}
```

### Scenario 8: Paginated Query with Error Handling

```typescript
// app/routes/perfumes.tsx
import { withLoaderErrorHandling } from "~/utils/errorHandling.server"
import { createError } from "~/utils/errorHandling"

export const loader = withLoaderErrorHandling(async ({ request }) => {
  const url = new URL(request.url)
  const page = Number(url.searchParams.get("page") || "1")
  const limit = Number(url.searchParams.get("limit") || "20")

  // Validation
  if (page < 1) {
    throw createError.validation("Invalid page number", {
      page,
      min: 1,
    })
  }

  if (limit < 1 || limit > 100) {
    throw createError.validation("Invalid limit", {
      limit,
      min: 1,
      max: 100,
    })
  }

  try {
    const skip = (page - 1) * limit

    const [perfumes, total] = await Promise.all([
      db.perfume.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.perfume.count(),
    ])

    return json({
      perfumes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    throw createError.database("Failed to fetch perfumes", {
      page,
      limit,
      originalError: error,
    })
  }
})
```

## API Calls & External Services

### Scenario 9: External API with Retry

```typescript
// app/services/fragrantica.server.ts
import { withRetry, retryPresets } from "~/utils/retry"
import { createError } from "~/utils/errorHandling"

export async function fetchFragranticaData(perfumeId: string) {
  return withRetry(
    async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      try {
        const response = await fetch(
          `https://api.fragrantica.com/perfumes/${perfumeId}`,
          {
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${process.env.FRAGRANTICA_API_KEY}`,
            },
          }
        )

        if (!response.ok) {
          if (response.status === 404) {
            throw createError.notFound("Perfume not found on Fragrantica", {
              perfumeId,
            })
          }

          if (response.status === 401) {
            throw createError.authentication("Fragrantica API authentication failed")
          }

          if (response.status === 429) {
            throw createError.network("Rate limit exceeded", {
              retryAfter: response.headers.get("Retry-After"),
            })
          }

          throw createError.externalApi("Fragrantica API error", {
            status: response.status,
            statusText: response.statusText,
          })
        }

        return await response.json()
      } catch (error) {
        if (error.name === "AbortError") {
          throw createError.network("Request timeout", {
            timeout: 10000,
            endpoint: `/perfumes/${perfumeId}`,
          })
        }

        if (error instanceof AppError) throw error

        throw createError.network("Network request failed", {
          originalError: error,
        })
      } finally {
        clearTimeout(timeoutId)
      }
    },
    retryPresets.aggressive // 5 retries for external APIs
  )
}
```

### Scenario 10: Client-Side API Call with Retry UI

```tsx
// app/components/PerfumeData.tsx
import { useApiWithRetry } from "~/hooks/useApiWithRetry"
import { retryPresets } from "~/utils/retry"

export function PerfumeData({ perfumeId }: Props) {
  const { fetchWithPreset, isLoading, isRetrying, retryCount, error, clearError } =
    useApiWithRetry({
      onRetry: (error, attempt, delay) => {
        console.log(`Retrying in ${delay}ms... (Attempt ${attempt})`)
      },
      onMaxRetriesReached: (error, attempts) => {
        console.error(`Failed after ${attempts} attempts`)
      },
    })

  const [data, setData] = useState(null)

  const loadData = async () => {
    const result = await fetchWithPreset(
      () =>
        fetch(`/api/perfumes/${perfumeId}`).then((r) => {
          if (!r.ok) throw r
          return r.json()
        }),
      "standard",
      `/api/perfumes/${perfumeId}`,
      "GET"
    )

    if (result) {
      setData(result)
      clearError()
    }
  }

  useEffect(() => {
    loadData()
  }, [perfumeId])

  return (
    <div>
      {isLoading && !isRetrying && <LoadingSpinner />}

      {isRetrying && (
        <div className="alert alert-warning">
          <p>Connection issues detected. Retrying...</p>
          <p>Attempt {retryCount} of 3</p>
        </div>
      )}

      {error && (
        <ErrorDisplay error={error} onRetry={loadData} onDismiss={clearError} />
      )}

      {data && <PerfumeDetails data={data} />}
    </div>
  )
}
```

### Scenario 11: Multiple Parallel API Calls

```typescript
// app/routes/dashboard.tsx
import { withLoaderErrorHandling } from "~/utils/errorHandling.server"
import { createError } from "~/utils/errorHandling"

export const loader = withLoaderErrorHandling(async ({ request }) => {
  const userId = await requireUserId(request)

  try {
    // Parallel requests with error handling
    const [user, perfumes, reviews, wishlist] = await Promise.allSettled([
      db.user.findUnique({ where: { id: userId } }),
      db.perfume.findMany({ where: { userId }, take: 10 }),
      db.review.findMany({ where: { userId }, take: 10 }),
      db.wishlist.findMany({ where: { userId }, take: 10 }),
    ])

    // Check for critical errors (user must exist)
    if (user.status === "rejected" || !user.value) {
      throw createError.notFound("User not found", { userId })
    }

    // Handle non-critical errors gracefully
    return json({
      user: user.value,
      perfumes: perfumes.status === "fulfilled" ? perfumes.value : [],
      reviews: reviews.status === "fulfilled" ? reviews.value : [],
      wishlist: wishlist.status === "fulfilled" ? wishlist.value : [],
      errors: {
        perfumes: perfumes.status === "rejected",
        reviews: reviews.status === "rejected",
        wishlist: wishlist.status === "rejected",
      },
    })
  } catch (error) {
    if (error instanceof AppError) throw error

    throw createError.database("Dashboard data fetch failed", {
      userId,
      originalError: error,
    })
  }
})
```

## File Uploads & Processing

### Scenario 12: CSV Import with Error Reporting

```typescript
// app/routes/admin/import.tsx
import { withActionErrorHandling } from "~/utils/errorHandling.server"
import { createError } from "~/utils/errorHandling"
import { parse } from "csv-parse/sync"

export const action = withActionErrorHandling(async ({ request }) => {
  const formData = await request.formData()
  const file = formData.get("csv") as File

  if (!file) {
    throw createError.validation("No file provided", { field: "csv" })
  }

  if (!file.name.endsWith(".csv")) {
    throw createError.validation("File must be CSV format", {
      fileName: file.name,
      fileType: file.type,
    })
  }

  try {
    const content = await file.text()
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
    })

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    }

    for (const [index, record] of records.entries()) {
      try {
        await db.perfume.create({
          data: {
            name: record.name,
            brand: record.brand,
            year: Number(record.year),
          },
        })
        results.success++
      } catch (error) {
        results.failed++
        results.errors.push({
          row: index + 2, // +2 for header and 0-index
          record: record,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    if (results.failed > 0) {
      return json({
        warning: true,
        message: `Import completed with errors: ${results.success} succeeded, ${results.failed} failed`,
        results,
      })
    }

    return json({
      success: true,
      message: `Successfully imported ${results.success} perfumes`,
      results,
    })
  } catch (error) {
    throw createError.server("CSV import failed", {
      fileName: file.name,
      originalError: error,
    })
  }
})
```

## Real-time Features

### Scenario 13: WebSocket Error Handling

```typescript
// app/services/websocket.client.ts
import { createError } from "~/utils/errorHandling"
import { ErrorLogger } from "~/utils/errorHandling"

export class WebSocketClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect(url: string) {
    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        console.log("WebSocket connected")
        this.reconnectAttempts = 0
      }

      this.ws.onerror = (event) => {
        const error = createError.network("WebSocket error", {
          url,
          reconnectAttempts: this.reconnectAttempts,
        })
        ErrorLogger.getInstance().log(error)
      }

      this.ws.onclose = (event) => {
        if (!event.wasClean) {
          this.handleReconnect(url)
        }
      }
    } catch (error) {
      throw createError.network("WebSocket connection failed", {
        url,
        originalError: error,
      })
    }
  }

  private handleReconnect(url: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      const error = createError.network("WebSocket reconnection failed", {
        attempts: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts,
      })
      throw error
    }

    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)

    setTimeout(() => {
      console.log(`Reconnecting... (Attempt ${this.reconnectAttempts})`)
      this.connect(url)
    }, delay)
  }
}
```

## Admin Operations

### Scenario 14: Bulk Delete with Confirmation

```typescript
// app/routes/admin/perfumes/delete-bulk.tsx
import { withActionErrorHandling } from "~/utils/errorHandling.server"
import { createError } from "~/utils/errorHandling"

export const action = withActionErrorHandling(async ({ request }) => {
  const userId = await requireUserId(request)

  // Check admin permission
  const user = await db.user.findUnique({ where: { id: userId } })
  if (user?.role !== "ADMIN") {
    throw createError.authorization("Admin access required", {
      userId,
      role: user?.role,
    })
  }

  const formData = await request.formData()
  const ids = formData.getAll("ids").map(String)

  if (ids.length === 0) {
    throw createError.validation("No IDs provided", {
      field: "ids",
    })
  }

  if (ids.length > 100) {
    throw createError.validation("Too many items to delete at once", {
      count: ids.length,
      max: 100,
    })
  }

  try {
    const result = await db.perfume.deleteMany({
      where: {
        id: { in: ids },
      },
    })

    if (result.count !== ids.length) {
      return json({
        warning: true,
        message: `Deleted ${result.count} of ${ids.length} perfumes. Some may not have existed.`,
        deleted: result.count,
        requested: ids.length,
      })
    }

    return json({
      success: true,
      message: `Successfully deleted ${result.count} perfumes`,
      deleted: result.count,
    })
  } catch (error) {
    throw createError.database("Bulk delete failed", {
      ids: ids.slice(0, 10), // Log first 10 IDs only
      count: ids.length,
      originalError: error,
    })
  }
})
```

---

## Quick Reference

### Error Type Mapping

| Scenario                 | Error Type       | HTTP Status |
| ------------------------ | ---------------- | ----------- |
| Missing required field   | `validation`     | 400         |
| Invalid email format     | `validation`     | 400         |
| Duplicate email          | `validation`     | 400         |
| Not logged in            | `authentication` | 401         |
| Wrong password           | `authentication` | 401         |
| Insufficient permissions | `authorization`  | 403         |
| Resource not found       | `notFound`       | 404         |
| Network timeout          | `network`        | 503         |
| External API down        | `externalApi`    | 502         |
| Database connection      | `database`       | 500         |
| Generic server error     | `server`         | 500         |

### Retry Guidelines

| Error Type       | Retry? | Preset     |
| ---------------- | ------ | ---------- |
| `validation`     | ❌ No  | N/A        |
| `authentication` | ❌ No  | N/A        |
| `authorization`  | ❌ No  | N/A        |
| `notFound`       | ❌ No  | N/A        |
| `network`        | ✅ Yes | aggressive |
| `server`         | ✅ Yes | standard   |
| `externalApi`    | ✅ Yes | aggressive |

---

_For more details, see the [Developer Guide](./ERROR_HANDLING_DEVELOPER_GUIDE.md) and [Troubleshooting Guide](./ERROR_HANDLING_TROUBLESHOOTING.md)._

_Last Updated: October 31, 2025_
