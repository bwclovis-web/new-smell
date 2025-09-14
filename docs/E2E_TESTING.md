# E2E Testing Documentation

This document provides comprehensive information about the End-to-End (E2E) testing setup for the Voodoo Perfumes application using Playwright.

## Overview

The E2E testing suite ensures that the application works correctly from the user's perspective by testing complete user workflows across multiple browsers and devices.

## Test Structure

```
test/e2e/
├── pages/                    # Page Object Models
│   ├── BasePage.ts          # Base page class
│   ├── HomePage.ts          # Home page
│   ├── LoginPage.ts         # Login page
│   ├── SignUpPage.ts        # Sign up page
│   ├── VaultPage.ts         # Perfume vault page
│   ├── PerfumePage.ts       # Individual perfume page
│   └── AdminPage.ts         # Admin dashboard page
├── utils/                    # Test utilities
│   ├── test-helpers.ts      # Common test helpers
│   └── test-data-manager.ts # Test data management
├── fixtures/                 # Test data
│   └── test-data.json       # Test data fixtures
├── setup/                    # Test setup files
├── global-setup.ts          # Global test setup
├── global-teardown.ts       # Global test teardown
├── basic-functionality.test.ts      # Basic functionality tests
├── critical-user-flows.test.ts      # Critical user flow tests
└── admin-flows.test.ts              # Admin flow tests
```

## Configuration Files

- `playwright.config.ts` - Main configuration for local development
- `playwright.config.ci.ts` - CI/CD optimized configuration
- `.github/workflows/e2e-tests.yml` - Full E2E test workflow
- `.github/workflows/e2e-pr.yml` - Pull request E2E test workflow

## Running Tests

### Local Development

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

# Run specific test suites
npm run test:e2e:critical
npm run test:e2e:mobile
```

### CI/CD

```bash
# Run tests with CI configuration
npm run test:e2e:ci
```

## Test Categories

### 1. Basic Functionality Tests

- Application loading
- Navigation
- Responsive design
- Error handling

### 2. Critical User Flow Tests

- **Authentication Flows**

  - User sign up
  - User login
  - Password validation
  - Error handling

- **Perfume Browsing Flows**

  - Browse perfumes in vault
  - Search functionality
  - Filter by letter
  - Sort options
  - No results handling

- **Perfume Detail Flows**

  - View perfume details
  - Add to wishlist
  - Rate perfumes
  - Navigation

- **Navigation Flows**

  - Page navigation
  - State maintenance
  - Back button functionality

- **Error Handling Flows**

  - Network error handling
  - Error message display
  - Graceful degradation

- **Mobile Responsiveness**
  - Mobile viewport testing
  - Touch interactions
  - Responsive layouts

### 3. Admin Flow Tests

- Admin dashboard access
- Security monitor
- Data quality checks
- User management
- Content creation
- Access control

## Page Object Model

The tests use a Page Object Model pattern for better maintainability and reusability:

### BasePage

Common functionality for all pages:

- Navigation helpers
- Screenshot capture
- Error checking
- Wait utilities

### Specific Page Objects

Each page has its own class with:

- Page-specific selectors
- Page-specific actions
- Page-specific assertions
- Navigation methods

## Test Data Management

### Test Data Fixtures

Located in `test/e2e/fixtures/test-data.json`:

- User accounts (admin, regular, new user)
- Perfume data
- Perfume house data
- Search queries
- Rating data
- URLs

### Test Data Manager

The `TestDataManager` class provides:

- Data retrieval methods
- Random data generation
- Test data cleanup
- Setup utilities

## CI/CD Integration

### GitHub Actions Workflows

#### Full E2E Tests (`e2e-tests.yml`)

- Runs on push to main/develop branches
- Runs on pull requests
- Scheduled daily runs
- Tests multiple browsers and viewports
- Generates comprehensive reports

#### PR E2E Tests (`e2e-pr.yml`)

- Runs on pull request events
- Faster execution with fewer browsers
- Comments PR with test results
- Uploads artifacts for review

### Test Execution Strategy

1. **Matrix Testing**: Tests run on multiple browsers and viewports
2. **Parallel Execution**: Tests run in parallel for faster execution
3. **Retry Logic**: Failed tests are retried automatically
4. **Artifact Collection**: Screenshots, videos, and reports are saved
5. **Notification**: Results are posted to PRs and stored as artifacts

## Best Practices

### Test Writing

1. **Use Page Objects**: Encapsulate page interactions
2. **Wait for Elements**: Always wait for elements to be ready
3. **Take Screenshots**: Use screenshots for debugging
4. **Check for Errors**: Verify no console errors occur
5. **Mobile Testing**: Test responsive behavior
6. **Clean Up**: Ensure tests clean up after themselves

### Selectors

1. **Use data-testid**: Prefer `data-testid` attributes
2. **Avoid CSS selectors**: Use semantic selectors when possible
3. **Wait for visibility**: Wait for elements to be visible before interacting
4. **Handle dynamic content**: Account for loading states

### Test Data

1. **Use fixtures**: Store test data in JSON files
2. **Generate unique data**: Use timestamps for unique identifiers
3. **Clean up**: Remove test data after tests complete
4. **Isolate tests**: Each test should be independent

## Debugging

### Visual Debugging

```bash
# Run with UI for step-by-step debugging
npm run test:e2e:ui

# Run in headed mode to see browser
npm run test:e2e:headed

# Debug specific test
npx playwright test --debug basic-functionality.test.ts
```

### Console Debugging

```bash
# Run with debug output
DEBUG=pw:api npx playwright test

# Run specific test with debug
npx playwright test --debug --project=chromium
```

### Screenshots and Videos

- Screenshots are automatically taken on test failures
- Videos are recorded for failed tests
- All artifacts are saved in `test-results/artifacts/`

## Performance Considerations

### Test Execution

- Tests run in parallel for faster execution
- CI uses fewer workers to avoid resource conflicts
- Critical tests run separately for quick feedback

### Resource Management

- Browsers are closed after each test
- Test data is cleaned up
- Artifacts are limited in size and retention

## Monitoring and Reporting

### Test Reports

- HTML reports with detailed results
- JSON reports for programmatic access
- JUnit reports for CI integration
- GitHub integration for PR comments

### Artifacts

- Screenshots on failure
- Videos on failure
- Trace files for debugging
- Test results in multiple formats

## Troubleshooting

### Common Issues

1. **Application not starting**

   - Check that the dev server starts correctly
   - Verify port 2112 is available
   - Check environment variables

2. **Timeout errors**

   - Increase timeout values in configuration
   - Check for slow network requests
   - Verify application performance

3. **Element not found**

   - Ensure proper selectors
   - Wait for elements to be ready
   - Check for dynamic content loading

4. **Browser issues**
   - Update Playwright browsers: `npx playwright install`
   - Check browser compatibility
   - Verify system dependencies

### Getting Help

- Check the [Playwright documentation](https://playwright.dev/)
- Review test logs in `test-results/`
- Use the test UI for interactive debugging
- Check GitHub Actions logs for CI issues

## Future Enhancements

### Planned Improvements

1. **Visual Regression Testing**: Add screenshot comparison tests
2. **Performance Testing**: Add performance benchmarks
3. **Accessibility Testing**: Add a11y testing
4. **API Testing**: Add API endpoint testing
5. **Database Testing**: Add database state verification

### Monitoring

1. **Test Metrics**: Track test execution times
2. **Flaky Test Detection**: Identify and fix flaky tests
3. **Coverage Reporting**: Track E2E test coverage
4. **Alert System**: Notify on test failures
