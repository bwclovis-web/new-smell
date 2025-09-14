import { Page } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * Home page object model
 */
export class HomePage extends BasePage {
  // Selectors
  private readonly selectors = {
    heroSection: '[data-testid="hero-section"]',
    navigation: '[data-testid="main-navigation"]',
    searchInput: '[data-testid="search-input"]',
    searchButton: '[data-testid="search-button"]',
    featuredPerfumes: '[data-testid="featured-perfumes"]',
    perfumeCards: '[data-testid="perfume-card"]',
    loadMoreButton: '[data-testid="load-more"]',
    languageSwitch: '[data-testid="language-switch"]',
    loginButton: '[data-testid="login-button"]',
    registerButton: '[data-testid="register-button"]'
  }

  constructor(page: Page) {
    super(page)
  }

  /**
   * Navigate to the home page
   */
  async navigateTo(): Promise<void> {
    await this.helpers.navigateTo('/')
    await this.waitForReady()
  }

  /**
   * Check if the hero section is visible
   */
  async isHeroSectionVisible(): Promise<boolean> {
    return await this.helpers.elementExists(this.selectors.heroSection)
  }

  /**
   * Check if the navigation is visible
   */
  async isNavigationVisible(): Promise<boolean> {
    return await this.helpers.elementExists(this.selectors.navigation)
  }

  /**
   * Perform a search
   */
  async search(query: string): Promise<void> {
    await this.helpers.fillField(this.selectors.searchInput, query)
    await this.helpers.clickAndWait(this.selectors.searchButton, true)
    await this.waitForReady()
  }

  /**
   * Get the number of perfume cards displayed
   */
  async getPerfumeCardCount(): Promise<number> {
    const cards = await this.page.locator(this.selectors.perfumeCards).count()
    return cards
  }

  /**
   * Click on a perfume card
   */
  async clickPerfumeCard(index: number): Promise<void> {
    const card = this.page.locator(this.selectors.perfumeCards).nth(index)
    await card.click()
    await this.waitForReady()
  }

  /**
   * Click load more button
   */
  async clickLoadMore(): Promise<void> {
    await this.helpers.clickAndWait(this.selectors.loadMoreButton)
    await this.waitForReady()
  }

  /**
   * Switch language
   */
  async switchLanguage(): Promise<void> {
    await this.helpers.clickAndWait(this.selectors.languageSwitch)
    await this.waitForReady()
  }

  /**
   * Click login button
   */
  async clickLogin(): Promise<void> {
    await this.helpers.clickAndWait(this.selectors.loginButton, true)
    await this.waitForReady()
  }

  /**
   * Click register button
   */
  async clickRegister(): Promise<void> {
    await this.helpers.clickAndWait(this.selectors.registerButton, true)
    await this.waitForReady()
  }

  /**
   * Wait for featured perfumes to load
   */
  async waitForFeaturedPerfumes(): Promise<void> {
    await this.helpers.waitForClickable(this.selectors.featuredPerfumes)
  }

  /**
   * Assert the page is loaded correctly
   */
  async assertPageLoaded(): Promise<void> {
    await this.helpers.assertVisible(this.selectors.heroSection)
    await this.helpers.assertVisible(this.selectors.navigation)
  }
}
