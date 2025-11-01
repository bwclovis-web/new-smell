# Visual Regression Testing Guide

## Overview

Visual regression testing helps detect unintended visual changes in the UI by comparing screenshots of components and pages against baseline images.

## Test Coverage

The visual regression test suite (`visual-regression.test.ts`) covers:

- **Page Layouts**: Homepage, Vault, Perfume Detail, Login, Signup
- **Component States**: Buttons (normal, hover), Forms (empty, filled, focused, error), Loading states, Modals
- **Navigation**: Global navigation, Mobile navigation (closed/open), Footer
- **Cards**: Perfume cards, Link cards (normal and hover states)
- **Interactive Elements**: Rating stars, Dropdown menus, Search bar, Tag filters
- **Responsive Layouts**: Mobile (375px), Tablet (768px), Desktop (1920px)
- **Error States**: 404 page, Error boundaries, Empty states
- **Dark Mode**: Homepage and Vault in dark mode
- **Print Styles**: Print media layout
- **Animation States**: Page transitions, Loading animations
- **Accessibility States**: Keyboard focus, High contrast mode

## Running Visual Tests

### First Time Setup (Creating Baselines)

When running the tests for the first time, you need to create baseline screenshots:

```bash
# Run tests and accept all screenshots as baselines
npm run test:e2e -- visual-regression.test.ts --update-snapshots
```

This will create baseline images in `test-results/screenshots/`.

### Running Tests

To run visual regression tests and compare against baselines:

```bash
# Run all visual regression tests
npm run test:e2e -- visual-regression.test.ts

# Run specific test suite
npm run test:e2e -- visual-regression.test.ts --grep "Page Layouts"

# Run in headed mode to see browser
npm run test:e2e:headed -- visual-regression.test.ts

# Run in debug mode
npm run test:e2e:debug -- visual-regression.test.ts
```

### Updating Baselines

When you intentionally change the UI and need to update baselines:

```bash
# Update all baselines
npm run test:e2e -- visual-regression.test.ts --update-snapshots

# Update specific test baselines
npm run test:e2e -- visual-regression.test.ts --grep "Button variants" --update-snapshots
```

### Reviewing Failures

When a visual regression test fails:

1. Playwright generates a diff image showing the differences
2. Check the test report: `npm run test:e2e:report`
3. Review the diff images in `test-results/`
4. Decide if the change is intentional or a regression:
   - **Intentional**: Update the baseline with `--update-snapshots`
   - **Regression**: Fix the UI issue and re-run tests

## Screenshot Options

The test suite uses the following Playwright screenshot options:

```typescript
await expect(page).toHaveScreenshot("filename.png", {
  fullPage: true, // Capture entire page (not just viewport)
  animations: "disabled", // Disable animations for consistent screenshots
})
```

### Common Options

- `fullPage: true` - Captures the entire scrollable page
- `animations: 'disabled'` - Disables CSS animations and transitions
- `animations: 'allow'` - Allows animations (useful for testing animation states)
- `maxDiffPixels: 100` - Maximum number of different pixels allowed
- `threshold: 0.2` - Pixel difference threshold (0-1)

## Best Practices

### 1. Wait for Page Stability

Always wait for the page to be fully loaded before taking screenshots:

```typescript
await page.waitForLoadState("networkidle")
await page.waitForTimeout(500) // Wait for animations to complete
```

### 2. Disable Animations

For consistent screenshots, disable animations:

```typescript
await expect(page).toHaveScreenshot("page.png", {
  animations: "disabled",
})
```

### 3. Handle Dynamic Content

For pages with dynamic content (dates, times, random data):

```typescript
// Hide or mock dynamic content before screenshot
await page.evaluate(() => {
  document.querySelectorAll("[data-dynamic]").forEach((el) => {
    el.textContent = "MOCKED_CONTENT"
  })
})
```

### 4. Test Multiple States

Capture important UI states:

```typescript
// Normal state
await expect(button).toHaveScreenshot("button-normal.png")

// Hover state
await button.hover()
await expect(button).toHaveScreenshot("button-hover.png")

// Focus state
await button.focus()
await expect(button).toHaveScreenshot("button-focus.png")
```

### 5. Test Responsive Layouts

Test different viewport sizes:

```typescript
await page.setViewportSize({ width: 375, height: 667 }) // Mobile
await page.setViewportSize({ width: 768, height: 1024 }) // Tablet
await page.setViewportSize({ width: 1920, height: 1080 }) // Desktop
```

## CI/CD Integration

Visual regression tests are included in the CI pipeline:

```bash
# Run in CI mode
npm run test:e2e:ci
```

### Handling CI Failures

In CI, visual differences may occur due to:

1. **Font Rendering**: Different OS/browser versions may render fonts slightly differently
2. **Image Rendering**: Anti-aliasing differences
3. **Timing Issues**: Page not fully loaded

Solutions:

1. Adjust threshold: `threshold: 0.2` (allows 20% pixel difference)
2. Adjust maxDiffPixels: `maxDiffPixels: 100` (allows up to 100 different pixels)
3. Use `animations: 'disabled'` consistently
4. Add appropriate wait conditions

## Test Structure

```typescript
test.describe("Visual Regression Tests", () => {
  test.describe("Category Name", () => {
    test("should match specific element", async ({ page }) => {
      // 1. Navigate to page
      await page.goto("/path")

      // 2. Wait for stability
      await page.waitForLoadState("networkidle")

      // 3. Take screenshot
      await expect(page).toHaveScreenshot("filename.png", {
        fullPage: true,
        animations: "disabled",
      })
    })
  })
})
```

## Troubleshooting

### Screenshots Don't Match

1. Check if the UI actually changed (review diff images)
2. Verify page is fully loaded before screenshot
3. Ensure animations are disabled
4. Check viewport size consistency
5. Review dynamic content (dates, times, random IDs)

### Flaky Tests

1. Add longer wait times: `await page.waitForTimeout(1000)`
2. Wait for specific elements: `await page.waitForSelector('[data-testid="content"]')`
3. Disable animations: `animations: 'disabled'`
4. Increase threshold: `threshold: 0.3`

### Different Results on CI vs Local

1. Regenerate baselines in CI environment
2. Adjust threshold to account for rendering differences
3. Use Docker to match CI environment locally
4. Check font availability on CI

## Maintenance

### When to Update Baselines

Update baselines when:

- Intentional UI changes are made
- Design updates are implemented
- Component styles are updated
- Layout changes are introduced

### When to Investigate Failures

Investigate failures when:

- Tests pass locally but fail in CI
- Multiple unrelated tests fail
- Diffs show unexpected changes
- No intentional UI changes were made

## Resources

- [Playwright Screenshot Comparison](https://playwright.dev/docs/test-snapshots)
- [Visual Testing Best Practices](https://playwright.dev/docs/best-practices#use-web-first-assertions)
- [Handling Flaky Tests](https://playwright.dev/docs/test-timeouts)

## Example Test

```typescript
test("should match homepage layout", async ({ page }) => {
  // Navigate to homepage
  const homePage = new HomePage(page)
  await homePage.navigateTo()
  await homePage.waitForReady()

  // Wait for animations to complete
  await page.waitForTimeout(500)

  // Take full page screenshot
  await expect(page).toHaveScreenshot("homepage-full.png", {
    fullPage: true,
    animations: "disabled",
  })
})
```

## Contributing

When adding new visual regression tests:

1. Follow existing naming conventions
2. Group related tests in `describe` blocks
3. Use descriptive screenshot filenames
4. Document any special setup or wait conditions
5. Test multiple states when relevant
6. Include responsive variants if applicable
7. Update this README if adding new test patterns
