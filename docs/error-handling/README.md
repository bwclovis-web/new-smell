# Error Handling System

Complete documentation for the error handling system in the New Smell project.

## Quick Start

**New to error handling?** Start with the [Developer Guide](./developer-guide.md) and [Common Scenarios](./common-scenarios.md).

## Documentation

### Developer Guide

**[developer-guide.md](./developer-guide.md)** ⭐ **START HERE**

Complete reference guide covering:

- Quick start examples (client & server)
- Error types and severity levels
- Creating errors with factory methods
- Client-side error handling (hooks, boundaries)
- Server-side error handling (loaders, actions)
- Best practices and common patterns
- Testing error handling
- Complete API reference

### Common Scenarios

**[common-scenarios.md](./common-scenarios.md)**

Ready-to-use code examples for 14+ common scenarios:

- User authentication and login
- Form validation
- Database operations
- External API integration
- File uploads
- Transaction handling
- And more...

### Troubleshooting

**[troubleshooting.md](./troubleshooting.md)**

Solutions to common issues and debugging tips:

- Error handling not working
- Missing correlation IDs
- Retry mechanism issues
- Performance concerns
- Testing problems
- Debugging strategies

### Architecture

**[architecture.md](./architecture.md)**

Technical implementation plan and system architecture:

- System design decisions
- Component architecture
- Error flow diagrams
- Implementation details
- Extension points

### Performance Metrics

**[performance-metrics.md](./performance-metrics.md)**

Performance benchmarks and metrics:

- Response time measurements (<100ms overhead)
- Memory usage analysis
- Load testing results
- Performance optimization strategies

## System Features

**Client-Side:**

- React hooks for error handling (`useApiErrorHandler`, `useApiWithRetry`)
- Error boundaries for component tree errors
- Automatic retry with configurable strategies
- User-friendly error displays

**Server-Side:**

- Route handler wrappers (`withLoaderErrorHandling`, `withActionErrorHandling`)
- Specialized handlers (Database, Auth, Validation)
- Automatic error logging with correlation IDs
- Security-first approach (sensitive data sanitization)

**Performance:**

- All operations complete in < 100ms
- Memory-efficient logging (circular buffer)
- No memory leaks detected
- Comprehensive performance test suite

## Quick Examples

### Client-Side API Call

```typescript
import { useApiWithRetry } from "~/hooks/useApiWithRetry"

function MyComponent() {
  const { fetchWithRetry, error, isLoading } = useApiWithRetry()

  const loadData = () =>
    fetchWithRetry(() => fetch("/api/data").then((r) => r.json()), {
      endpoint: "/api/data",
      method: "GET",
    })

  return isLoading ? <Spinner /> : <Data />
}
```

### Server-Side Route

```typescript
import { withLoaderErrorHandling } from "~/utils/errorHandling.server"
import { createError } from "~/utils/errorHandling"

export const loader = withLoaderErrorHandling(async ({ params }) => {
  const data = await db.getData(params.id)
  if (!data) {
    throw createError.notFound("Data not found", { id: params.id })
  }
  return json({ data })
})
```

## Common Tasks

- **Adding error handling to a route** → See [Common Scenarios](./common-scenarios.md)
- **Handling API calls with retry** → See [Developer Guide](./developer-guide.md#useapiwithretry)
- **Debugging correlation IDs** → See [Troubleshooting](./troubleshooting.md)
- **Performance concerns** → See [Performance Metrics](./performance-metrics.md)

## Testing

- 356+ unit tests for error handling components
- 105+ integration tests
- 17 E2E tests for error UX
- 19 performance tests

---

_Last Updated: November 1, 2025_




