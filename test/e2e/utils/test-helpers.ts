import { Page, expect } from '@playwright/test'

/**
 * Common test utilities for E2E tests
 */

export class TestHelpers {
  constructor(private page: Page) { }

  /**
   * Wait for the page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle')
    await this.page.waitForLoadState('domcontentloaded')
  }

  /**
   * Navigate to a page and wait for it to load
   */
  async navigateTo(path: string) {
    await this.page.goto(path)
    await this.waitForPageLoad()
  }

  /**
   * Wait for an element to be visible and clickable
   */
  async waitForClickable(selector: string, timeout = 10000) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout })
    await this.page.waitForSelector(selector, { state: 'attached', timeout })
  }

  /**
   * Click an element and wait for navigation if needed
   */
  async clickAndWait(selector: string, waitForNavigation = false) {
    if (waitForNavigation) {
      await Promise.all([
        this.page.waitForNavigation(),
        this.page.click(selector)
      ])
    } else {
      await this.page.click(selector)
    }
  }

  /**
   * Fill a form field
   */
  async fillField(selector: string, value: string) {
    await this.page.waitForSelector(selector, { state: 'visible' })
    await this.page.fill(selector, value)
  }

  /**
   * Select an option from a dropdown
   */
  async selectOption(selector: string, value: string) {
    await this.page.waitForSelector(selector, { state: 'visible' })
    await this.page.selectOption(selector, value)
  }

  /**
   * Wait for text to appear on the page
   */
  async waitForText(text: string, timeout = 10000) {
    await this.page.waitForSelector(`text=${text}`, { timeout })
  }

  /**
   * Check if an element exists
   */
  async elementExists(selector: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout: 1000 })
      return true
    } catch {
      return false
    }
  }

  /**
   * Take a screenshot for debugging
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true
    })
  }

  /**
   * Wait for API response
   */
  async waitForAPIResponse(urlPattern: string | RegExp) {
    return await this.page.waitForResponse(response => {
      const url = response.url()
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern)
      }
      return urlPattern.test(url)
    })
  }

  /**
   * Check for console errors
   */
  async checkForConsoleErrors() {
    const errors: string[] = []

    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    return errors
  }

  /**
   * Wait for loading spinner to disappear
   */
  async waitForLoadingToComplete() {
    // Wait for common loading indicators to disappear
    const loadingSelectors = [
      '[data-testid="loading"]',
      '.loading',
      '.spinner',
      '[aria-label="Loading"]'
    ]

    for (const selector of loadingSelectors) {
      try {
        await this.page.waitForSelector(selector, { state: 'hidden', timeout: 5000 })
      } catch {
        // Ignore if selector doesn't exist
      }
    }
  }

  /**
   * Assert page title
   */
  async assertPageTitle(expectedTitle: string) {
    await expect(this.page).toHaveTitle(expectedTitle)
  }

  /**
   * Assert URL contains expected path
   */
  async assertURL(expectedPath: string) {
    await expect(this.page).toHaveURL(new RegExp(expectedPath))
  }

  /**
   * Assert element is visible
   */
  async assertVisible(selector: string) {
    await expect(this.page.locator(selector)).toBeVisible()
  }

  /**
   * Assert element is hidden
   */
  async assertHidden(selector: string) {
    await expect(this.page.locator(selector)).toBeHidden()
  }

  /**
   * Assert text content
   */
  async assertText(selector: string, expectedText: string) {
    await expect(this.page.locator(selector)).toHaveText(expectedText)
  }

  /**
   * Assert element count
   */
  async assertCount(selector: string, expectedCount: number) {
    await expect(this.page.locator(selector)).toHaveCount(expectedCount)
  }
}
