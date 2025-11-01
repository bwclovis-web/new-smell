# Performance Testing

This directory contains performance tests for measuring the overhead and efficiency of various system components.

## Error Handling Performance Tests

**File:** `error-handling-overhead.perf.test.ts`

### Purpose

Comprehensive performance benchmarks to ensure the error handling system maintains acceptable overhead across all operations. The target is < 100ms overhead for typical error handling flows.

### Test Coverage

#### 1. Error Creation Overhead

- Tests creation of 1000+ AppError instances
- Tests all error types (validation, authentication, authorization, network, server, etc.)
- **Result:** ~67ms for 1000 errors (0.067ms per error)

#### 2. Error Handler Wrapper Overhead

- Tests `asyncErrorHandler` wrapper with successful operations
- Tests error handling with failures
- Tests nested wrapper overhead
- **Result:** < 20ms for 1000 wrapped function calls

#### 3. Retry Mechanism Performance

- Tests retry wrapper overhead on successful operations (no retries needed)
- Tests retry behavior with fake timers
- Tests concurrent retry operations
- Tests memory usage during retries
- **Result:** ~5ms for 1000 operations (no retries)

#### 4. ErrorLogger Performance

- Tests logging 1000 errors efficiently
- Tests memory limits (MAX_LOGS = 1000)
- Tests log retrieval efficiency
- Tests log clearing
- **Result:** 11-15ms for 100 log operations

#### 5. Overall Error Handling Overhead

- Tests complete error handling flow (create → log → handle → wrap)
- Tests high-frequency error scenarios (1000+ errors)
- Tests concurrent load (500+ operations)
- **Result:** < 10ms for 100 complete error flows

#### 6. Error Sanitization Overhead

- Tests sanitization of sensitive data in errors
- **Result:** < 100ms for 1000 sanitizations

#### 7. Performance Benchmarks Summary

Comprehensive summary test that validates all components meet the < 100ms requirement:

```
=== Error Handling Performance Summary ===
Error Creation (100x):    0-6ms
Error Handling (100x):    0-5ms
Retry Mechanism (100x):   0-5ms
Error Logging (100x):     11-15ms
Overall Overhead (100x):  5-10ms
==========================================
```

### Running the Tests

```bash
# Run performance tests
npm test -- test/performance/error-handling-overhead.perf.test.ts --run

# Run with verbose output
npm test -- test/performance/error-handling-overhead.perf.test.ts --run --reporter=verbose
```

### Performance Targets

| Metric                  | Target      | Actual     | Status      |
| ----------------------- | ----------- | ---------- | ----------- |
| Error Creation (100x)   | < 100ms     | ~0-6ms     | ✅ Pass     |
| Error Handling (100x)   | < 100ms     | ~0-5ms     | ✅ Pass     |
| Retry Mechanism (100x)  | < 100ms     | ~0-5ms     | ✅ Pass     |
| Error Logging (100x)    | < 100ms     | ~11-15ms   | ✅ Pass     |
| Overall Overhead (100x) | < 100ms     | ~5-10ms    | ✅ Pass     |
| **Total**               | **< 100ms** | **< 50ms** | **✅ Pass** |

### Key Findings

1. **Error Creation:** Extremely fast (~0.067ms per error), no performance concerns
2. **Error Handling Wrappers:** Minimal overhead, even with nested wrappers
3. **Retry Mechanism:** Negligible overhead when retries aren't needed
4. **Error Logging:** Efficient with built-in memory management (MAX_LOGS = 1000)
5. **Overall System:** Total overhead well under 100ms target across all operations

### Memory Management

- **ErrorLogger:** Implements circular buffer with MAX_LOGS = 1000
- **Retry Operations:** No memory leaks detected in stress tests
- **Memory Increase:** < 5MB even with 1500+ log attempts

### Notes

- Tests use fake timers where appropriate to avoid actual delays
- Performance measurements may vary slightly between runs
- All tests consistently pass with significant margin below targets
- Real-world overhead is expected to be similar or better due to optimizations

## Other Performance Tests

- `component-rendering.perf.tsx` - Component rendering performance
- `virtual-scroll-performance.test.tsx` - Virtual scrolling performance

## Setup

Performance tests use the `setup-performance.ts` configuration which provides:

- Performance measurement utilities
- Memory measurement utilities
- Mock performance APIs
- Fake timers support

## Best Practices

1. Use `global.measurePerformance()` for timing measurements
2. Use `global.measureMemory()` for memory measurements
3. Clear state between tests (e.g., `logger.clearLogs()`)
4. Use fake timers for retry/delay tests
5. Set realistic thresholds based on actual performance data
6. Test both success and failure scenarios
