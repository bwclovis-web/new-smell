# E2E Testing with Playwright

This directory contains end-to-end tests for the Voodoo Perfumes application using Playwright.

## Setup

The E2E testing setup includes:

- **Playwright Configuration**: `playwright.config.ts` with multi-browser support
- **Test Structure**: Organized test files and page objects
- **Utilities**: Common test helpers and page object models
- **Global Setup/Teardown**: Application readiness checks and cleanup

## Running Tests

### Basic Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI (interactive mode)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Specific Test Runs

```bash
# Run specific test file
npx playwright test basic-functionality.test.ts

# Run tests for specific browser
npx playwright test --project=chromium

# Run tests in headed mode for debugging
npx playwright test --headed --project=chromium
```

## Test Structure

```
test/e2e/
├── pages/                        # Page Object Models
│   ├── BasePage.ts
│   ├── HomePage.ts
│   ├── LoginPage.ts
│   ├── SignUpPage.ts
│   ├── VaultPage.ts
│   ├── PerfumePage.ts
│   └── AdminPage.ts
├── utils/                        # Test utilities and helpers
│   ├── test-helpers.ts
│   └── test-data-manager.ts
├── fixtures/                     # Test data and fixtures
│   └── test-data.json
├── global-setup.ts               # Global test setup
├── global-teardown.ts            # Global test teardown
├── basic-functionality.test.ts   # Basic app functionality tests
├── critical-user-flows.test.ts   # Critical user journey tests
├── admin-flows.test.ts           # Admin functionality tests
├── perfume-discovery.test.ts     # Perfume search and discovery tests
├── user-profile.test.ts          # User profile and preferences tests
├── collection-management.test.ts # Collection CRUD operations tests
├── reviews-and-ratings.test.ts   # Review and rating workflow tests
├── wishlist-management.test.ts   # Wishlist functionality tests
├── accessibility.test.ts         # Accessibility and WCAG compliance tests
└── README.md                     # This file
```

## Test Coverage

The E2E test suite provides comprehensive coverage across all major user workflows:

### Core Functionality (3 test suites)

- **basic-functionality.test.ts**: Basic app loading, navigation, and responsiveness
- **critical-user-flows.test.ts**: Authentication, browsing, searching, and navigation flows
- **admin-flows.test.ts**: Admin dashboard and management functionality

### Extended Coverage (6 test suites)

- **perfume-discovery.test.ts** (80+ tests): Search, filter, sort, pagination, mobile discovery
- **user-profile.test.ts** (50+ tests): Profile management, password changes, notifications, privacy
- **collection-management.test.ts** (70+ tests): Collection CRUD, sharing, statistics, bulk actions
- **reviews-and-ratings.test.ts** (60+ tests): Rating system, review workflows, interactions
- **wishlist-management.test.ts** (70+ tests): Wishlist operations, organization, alerts
- **accessibility.test.ts** (40+ tests): WCAG 2.1 compliance, keyboard navigation, screen readers

**Total E2E Tests: 370+ comprehensive end-to-end tests**

## Page Object Model

The tests use a Page Object Model pattern for better maintainability:

- **BasePage**: Common functionality for all pages
- **HomePage**: Specific functionality for the home page
- **LoginPage**: Login and authentication functionality
- **SignUpPage**: User registration functionality
- **VaultPage**: Perfume browsing and discovery
- **PerfumePage**: Individual perfume details
- **AdminPage**: Admin dashboard and management
- **TestHelpers**: Reusable utility functions

## Configuration

The Playwright configuration supports:

- **Multiple Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Testing**: Mobile Chrome and Safari
- **Parallel Execution**: Tests run in parallel for speed
- **Screenshots & Videos**: Automatic capture on failures
- **Trace Collection**: Detailed debugging information
- **CI/CD Integration**: Optimized for continuous integration

## Test Data

Test data should be placed in the `fixtures/` directory and follow the naming convention:

- `test-data.json` - General test data
- `user-accounts.json` - User account test data
- `perfume-data.json` - Perfume test data

## Best Practices

1. **Use Page Objects**: Encapsulate page interactions in page object classes
2. **Wait for Elements**: Always wait for elements to be ready before interacting
3. **Take Screenshots**: Use screenshots for debugging and visual verification
4. **Check for Errors**: Verify no console errors occur during tests
5. **Mobile Testing**: Test responsive behavior on mobile devices
6. **Clean Up**: Ensure tests clean up after themselves

## Debugging

### Visual Debugging

```bash
# Run with UI for step-by-step debugging
npm run test:e2e:ui

# Run in headed mode to see browser
npm run test:e2e:headed
```

### Console Debugging

```bash
# Run with debug output
DEBUG=pw:api npx playwright test

# Run specific test with debug
npx playwright test --debug basic-functionality.test.ts
```

### Screenshots and Videos

- Screenshots are automatically taken on test failures
- Videos are recorded for failed tests
- All artifacts are saved in `test-results/artifacts/`

## CI/CD Integration

The tests are configured for CI/CD with:

- Retry logic for flaky tests
- Parallel execution with limited workers
- Artifact collection for debugging
- JUnit and JSON reporting formats

## Troubleshooting

### Common Issues

1. **Application not starting**: Check that the dev server starts correctly
2. **Timeout errors**: Increase timeout values in configuration
3. **Element not found**: Ensure proper selectors and wait conditions
4. **Browser issues**: Update Playwright browsers with `npx playwright install`

### Getting Help

- Check the [Playwright documentation](https://playwright.dev/)
- Review test logs in `test-results/`
- Use the test UI for interactive debugging
