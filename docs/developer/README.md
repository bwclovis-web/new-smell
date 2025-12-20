# Developer Documentation

This directory contains developer-specific documentation including AI integration plans, code quality guides, and implementation summaries.

## 📋 Table of Contents

### AI & Research

- **[AI_INTEGRATION_ROADMAP.md](./AI_INTEGRATION_ROADMAP.md)** - Roadmap for AI-powered features and enhancements
- **[CREWAI_USAGE.md](./CREWAI_USAGE.md)** - Guide for using CrewAI in the project
- **[RESEARCH_CREW_MISSING_DATA_ISSUES.md](./RESEARCH_CREW_MISSING_DATA_ISSUES.md)** - Research crew analysis for missing data
- **[RESEARCH_CREW_OPTIMIZATION_ANALYSIS.md](./RESEARCH_CREW_OPTIMIZATION_ANALYSIS.md)** - Optimization analysis from research crew
- **[RESEARCH_CREW_OPTIMIZATION_IMPLEMENTATION.md](./RESEARCH_CREW_OPTIMIZATION_IMPLEMENTATION.md)** - Implementation details for optimizations

### Code Quality & Patterns

- **[CODE_QUALITY_IMPROVEMENTS.md](./CODE_QUALITY_IMPROVEMENTS.md)** - Comprehensive guide to code quality standards, patterns, and best practices
- **[REUSABLE_PATTERNS.md](./REUSABLE_PATTERNS.md)** - Reusable code patterns and best practices

### Implementation Summaries

- **[DATA_FETCHING_CONSOLIDATION_SUMMARY.md](./DATA_FETCHING_CONSOLIDATION_SUMMARY.md)** - Summary of data fetching consolidation work
- **[MODAL_SYSTEM_GUIDE.md](./MODAL_SYSTEM_GUIDE.md)** - Guide to the modal system
- **[MODAL_UNIFICATION_SUMMARY.md](./MODAL_UNIFICATION_SUMMARY.md)** - Summary of modal system unification

## 🎯 Quick Reference

### When to Use Each Document

| Scenario                      | Document(s) to Reference                                        |
| ----------------------------- | --------------------------------------------------------------- |
| Starting a new feature        | [Implementation Checklist](../guides/implementation-checklist.md), CODE_QUALITY_IMPROVEMENTS |
| Implementing error handling   | [Error Handling Developer Guide](../error-handling/developer-guide.md), [Common Scenarios](../error-handling/common-scenarios.md) |
| Fixing bugs or errors         | [Error Handling Developer Guide](../error-handling/developer-guide.md), [Troubleshooting](../error-handling/troubleshooting.md) |
| Debugging error issues        | [Error Handling Troubleshooting](../error-handling/troubleshooting.md) |
| Optimizing performance        | [Performance Guide](../guides/performance.md), [Performance Audit](../audits/performance-components.md) |
| Refactoring components        | CODE_QUALITY_IMPROVEMENTS, [Archive: Duplicate Components](../archive/duplicate-components-analysis.md) |
| Security review               | [Security Guide](../guides/security.md) |
| DevOps/Infrastructure changes | [Infrastructure Guide](../guides/infrastructure.md) |
| Adding AI features            | AI_INTEGRATION_ROADMAP                                          |

## 📊 Report Data

Analysis reports and data exports can be found in the `../reports/` directory.

## 🔄 Keeping Documentation Updated

When making significant changes to the codebase:

1. Update relevant documentation to reflect new patterns or practices
2. Add entries to the appropriate document if new standards are established
3. Keep the IMPLEMENTATION_CHECKLIST current with new requirements
4. Update this README if new documentation is added

## 🤝 Contributing

All developers should familiarize themselves with:

1. [Code Quality Guide](../guides/code-quality.md) for coding standards
2. [Error Handling Developer Guide](../error-handling/developer-guide.md) for error handling patterns
3. [Security Guide](../guides/security.md) for security requirements

### Error Handling Quick Start

If you're working with errors, start here:

1. **Read:** [Error Handling Developer Guide](../error-handling/developer-guide.md) - Overview and API reference
2. **Copy:** [Common Scenarios](../error-handling/common-scenarios.md) - Find your scenario and copy the code
3. **Debug:** [Troubleshooting](../error-handling/troubleshooting.md) - Solutions to common issues

**Common Tasks:**

- Adding error handling to a route → See [Common Scenarios](../error-handling/common-scenarios.md)
- Handling API calls with retry → See [Error Handling Developer Guide](../error-handling/developer-guide.md)
- Debugging missing correlation IDs → See [Troubleshooting](../error-handling/troubleshooting.md)
- Performance concerns → See [Performance Metrics](../error-handling/performance-metrics.md)

---

_Last Updated: October 31, 2025_
