# Documentation

Welcome to the New Smell project documentation. This directory contains all project documentation organized by audience and purpose.

## 📁 Directory Structure

```
docs/
├── developer/          # Technical documentation for developers
│   ├── README.md      # Developer documentation index
│   ├── AI_INTEGRATION_ROADMAP.md
│   ├── CODE_QUALITY_IMPROVEMENTS.md
│   ├── DUPLICATE_COMPONENTS_ANALYSIS.md
│   ├── ERROR_HANDLING_IMPROVEMENT_PLAN.md
│   ├── IMPLEMENTATION_CHECKLIST.md
│   ├── INFRASTRUCTURE_IMPROVEMENTS.md
│   ├── PERFORMANCE_COMPONENTS_AUDIT.md
│   ├── PERFORMANCE_OPTIMIZATION_GUIDE.md
│   └── SECURITY_HARDENING_SUMMARY.md
└── reports/           # Analysis reports and data exports
```

## 🎯 Quick Navigation

### For Developers
👉 **[Developer Documentation](./developer/README.md)**

Comprehensive technical documentation covering:
- Code quality standards and best practices
- Performance optimization guidelines
- Security hardening measures
- Error handling patterns
- Infrastructure setup
- Implementation checklists

### For Data Analysis
📊 **[Reports Directory](./reports/)**

Contains analysis reports, metrics, and data exports including:
- Performance audits
- Code quality reports
- Security scans
- Component analysis data

## 🚀 Getting Started

### New Developers
1. Start with [Developer Documentation](./developer/README.md)
2. Review [CODE_QUALITY_IMPROVEMENTS.md](./developer/CODE_QUALITY_IMPROVEMENTS.md)
3. Check [IMPLEMENTATION_CHECKLIST.md](./developer/IMPLEMENTATION_CHECKLIST.md)

### Working on Specific Areas
- **Performance Issues**: See [PERFORMANCE_OPTIMIZATION_GUIDE.md](./developer/PERFORMANCE_OPTIMIZATION_GUIDE.md)
- **Error Handling**: See [Error Handling Documentation](#error-handling-documentation) below
- **Security**: See [SECURITY_HARDENING_SUMMARY.md](./developer/SECURITY_HARDENING_SUMMARY.md)
- **Infrastructure**: See [INFRASTRUCTURE_IMPROVEMENTS.md](./developer/INFRASTRUCTURE_IMPROVEMENTS.md)

## Error Handling Documentation

The project has a comprehensive error handling system with complete documentation:

### Quick Start
- **[Developer Guide](./developer/ERROR_HANDLING_DEVELOPER_GUIDE.md)** - Complete guide to using the error handling system
- **[Common Scenarios](./developer/ERROR_HANDLING_COMMON_SCENARIOS.md)** - Ready-to-use code examples for common situations
- **[Troubleshooting](./developer/ERROR_HANDLING_TROUBLESHOOTING.md)** - Solutions to common issues

### System Overview
The error handling system provides:
- ✅ Type-safe error creation and handling
- ✅ Automatic retry for transient failures
- ✅ User-friendly error messages
- ✅ Security (no sensitive data exposure)
- ✅ Performance optimized (< 100ms overhead)
- ✅ Correlation IDs for request tracking
- ✅ Comprehensive logging

### Key Features

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

### Documentation Structure

```
docs/developer/
├── ERROR_HANDLING_DEVELOPER_GUIDE.md      # Complete developer guide
├── ERROR_HANDLING_COMMON_SCENARIOS.md     # Code examples for common cases
├── ERROR_HANDLING_TROUBLESHOOTING.md      # Troubleshooting & debugging
├── ERROR_HANDLING_IMPROVEMENT_PLAN.md     # Implementation plan & architecture
└── PERFORMANCE_TESTING_SUMMARY.md         # Performance metrics & benchmarks
```

### Quick Examples

**Client-Side API Call:**
```tsx
import { useApiWithRetry } from '~/hooks/useApiWithRetry'

function MyComponent() {
  const { fetchWithRetry, error, isLoading } = useApiWithRetry()

  const loadData = () => fetchWithRetry(
    () => fetch('/api/data').then(r => r.json()),
    { endpoint: '/api/data', method: 'GET' }
  )

  return isLoading ? <Spinner /> : <Data />
}
```

**Server-Side Route:**
```typescript
import { withLoaderErrorHandling } from '~/utils/errorHandling.server'
import { createError } from '~/utils/errorHandling'

export const loader = withLoaderErrorHandling(async ({ params }) => {
  const data = await db.getData(params.id)
  if (!data) {
    throw createError.notFound('Data not found', { id: params.id })
  }
  return json({ data })
})
```

### Testing
- 356+ unit tests for error handling components
- 105+ integration tests
- 17 E2E tests for error UX
- 19 performance tests

For complete documentation, start with the **[Developer Guide](./developer/ERROR_HANDLING_DEVELOPER_GUIDE.md)**.

## 📝 Documentation Standards

All documentation in this project follows these principles:
- **Clear and Concise**: Easy to understand and navigate
- **Actionable**: Provides specific guidance and examples
- **Current**: Regularly updated to reflect codebase changes
- **Comprehensive**: Covers all aspects of development

## 🔄 Contributing to Documentation

When adding or updating documentation:
1. Place technical/developer docs in `developer/`
2. Place reports and analysis in `reports/`
3. Update relevant README files
4. Use clear, descriptive filenames
5. Include a table of contents for long documents
6. Add cross-references to related documentation

## 📞 Questions?

If you can't find what you're looking for:
1. Check the [Developer Documentation Index](./developer/README.md)
2. Search across all documentation files
3. Reach out to the development team

---

*Documentation Structure Last Updated: October 31, 2025*

