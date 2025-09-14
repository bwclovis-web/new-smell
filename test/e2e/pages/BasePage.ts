import { Page } from '@playwright/test'
import { TestHelpers } from '../utils/test-helpers'

/**
 * Base page class for all page objects
 */
export abstract class BasePage {
  protected helpers: TestHelpers

  constructor(protected page: Page) {
    this.helpers = new TestHelpers(page)
  }

  /**
   * Get the current page URL
   */
  async getCurrentURL(): Promise<string> {
    return this.page.url()
  }

  /**
   * Get the page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title()
  }

  /**
   * Wait for the page to be ready
   */
  async waitForReady(): Promise<void> {
    await this.helpers.waitForPageLoad()
    await this.helpers.waitForLoadingToComplete()
  }

  /**
   * Take a screenshot
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.helpers.takeScreenshot(name)
  }

  /**
   * Check for console errors
   */
  async checkForErrors(): Promise<string[]> {
    return await this.helpers.checkForConsoleErrors()
  }
}
