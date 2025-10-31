# Developer Documentation

This directory contains comprehensive developer documentation for the New Smell project. Below is an overview of each document and when to reference it.

## 📋 Table of Contents

### Getting Started
- **[IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)** - Step-by-step checklist for implementing new features and improvements
- **[AI_INTEGRATION_ROADMAP.md](./AI_INTEGRATION_ROADMAP.md)** - Roadmap for AI-powered features and enhancements

### Code Quality & Architecture
- **[CODE_QUALITY_IMPROVEMENTS.md](./CODE_QUALITY_IMPROVEMENTS.md)** - Comprehensive guide to code quality standards, patterns, and best practices
- **[DUPLICATE_COMPONENTS_ANALYSIS.md](./DUPLICATE_COMPONENTS_ANALYSIS.md)** - Analysis of duplicate components and consolidation strategies

### Error Handling (Complete System)
- **[ERROR_HANDLING_DEVELOPER_GUIDE.md](./ERROR_HANDLING_DEVELOPER_GUIDE.md)** - **⭐ START HERE** - Complete developer guide with all patterns and APIs
- **[ERROR_HANDLING_COMMON_SCENARIOS.md](./ERROR_HANDLING_COMMON_SCENARIOS.md)** - Ready-to-use code examples for 14+ common scenarios
- **[ERROR_HANDLING_TROUBLESHOOTING.md](./ERROR_HANDLING_TROUBLESHOOTING.md)** - Troubleshooting guide for common issues and debugging tips
- **[ERROR_HANDLING_IMPROVEMENT_PLAN.md](./ERROR_HANDLING_IMPROVEMENT_PLAN.md)** - Technical implementation plan and system architecture
- **[PERFORMANCE_TESTING_SUMMARY.md](./PERFORMANCE_TESTING_SUMMARY.md)** - Performance metrics and benchmarks (< 100ms overhead)

### Performance & Optimization
- **[PERFORMANCE_OPTIMIZATION_GUIDE.md](./PERFORMANCE_OPTIMIZATION_GUIDE.md)** - Complete guide to optimizing application performance
- **[PERFORMANCE_COMPONENTS_AUDIT.md](./PERFORMANCE_COMPONENTS_AUDIT.md)** - Audit of component performance and optimization opportunities

### Security & Infrastructure
- **[SECURITY_HARDENING_SUMMARY.md](./SECURITY_HARDENING_SUMMARY.md)** - Security best practices and hardening measures
- **[INFRASTRUCTURE_IMPROVEMENTS.md](./INFRASTRUCTURE_IMPROVEMENTS.md)** - Infrastructure setup, deployment, and operational improvements

## 🎯 Quick Reference

### When to Use Each Document

| Scenario | Document(s) to Reference |
|----------|-------------------------|
| Starting a new feature | IMPLEMENTATION_CHECKLIST, CODE_QUALITY_IMPROVEMENTS |
| Implementing error handling | ERROR_HANDLING_DEVELOPER_GUIDE, ERROR_HANDLING_COMMON_SCENARIOS |
| Fixing bugs or errors | ERROR_HANDLING_DEVELOPER_GUIDE, ERROR_HANDLING_TROUBLESHOOTING |
| Debugging error issues | ERROR_HANDLING_TROUBLESHOOTING |
| Optimizing performance | PERFORMANCE_OPTIMIZATION_GUIDE, PERFORMANCE_COMPONENTS_AUDIT |
| Refactoring components | DUPLICATE_COMPONENTS_ANALYSIS, CODE_QUALITY_IMPROVEMENTS |
| Security review | SECURITY_HARDENING_SUMMARY |
| DevOps/Infrastructure changes | INFRASTRUCTURE_IMPROVEMENTS |
| Adding AI features | AI_INTEGRATION_ROADMAP |

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
1. CODE_QUALITY_IMPROVEMENTS.md for coding standards
2. ERROR_HANDLING_DEVELOPER_GUIDE.md for error handling patterns
3. SECURITY_HARDENING_SUMMARY.md for security requirements

### Error Handling Quick Start

If you're working with errors, start here:

1. **Read:** [ERROR_HANDLING_DEVELOPER_GUIDE.md](./ERROR_HANDLING_DEVELOPER_GUIDE.md) - Overview and API reference
2. **Copy:** [ERROR_HANDLING_COMMON_SCENARIOS.md](./ERROR_HANDLING_COMMON_SCENARIOS.md) - Find your scenario and copy the code
3. **Debug:** [ERROR_HANDLING_TROUBLESHOOTING.md](./ERROR_HANDLING_TROUBLESHOOTING.md) - Solutions to common issues

**Common Tasks:**
- Adding error handling to a route → See [Common Scenarios](./ERROR_HANDLING_COMMON_SCENARIOS.md#server-side-error-handling)
- Handling API calls with retry → See [useApiWithRetry examples](./ERROR_HANDLING_DEVELOPER_GUIDE.md#useapiwithretry)
- Debugging missing correlation IDs → See [Troubleshooting](./ERROR_HANDLING_TROUBLESHOOTING.md#issue-5-correlation-ids-missing)
- Performance concerns → See [Performance Summary](./PERFORMANCE_TESTING_SUMMARY.md)

---

*Last Updated: October 31, 2025*

