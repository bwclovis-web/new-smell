import { Page } from '@playwright/test'

import { BasePage } from './BasePage'

/**
 * The Vault (perfume collection) page object model
 */
export class VaultPage extends BasePage {
  // Selectors
  private readonly selectors = {
    searchInput: '[data-testid="search-input"]',
    searchButton: '[data-testid="search-button"]',
    filterDropdown: '[data-testid="filter-dropdown"]',
    sortDropdown: '[data-testid="sort-dropdown"]',
    letterFilter: '[data-testid="letter-filter"]',
    perfumeCards: '[data-testid="perfume-card"]',
    perfumeCardTitle: '[data-testid="perfume-card-title"]',
    perfumeCardImage: '[data-testid="perfume-card-image"]',
    perfumeCardHouse: '[data-testid="perfume-card-house"]',
    loadMoreButton: '[data-testid="load-more"]',
    pagination: '[data-testid="pagination"]',
    loadingSpinner: '[data-testid="loading-spinner"]',
    noResultsMessage: '[data-testid="no-results"]',
    resultsCount: '[data-testid="results-count"]',
    wishlistButton: '[data-testid="wishlist-button"]',
    ratingStars: '[data-testid="rating-stars"]'
  }

  constructor(page: Page) {
    super(page)
  }

  /**
   * Navigate to the vault page
   */
  async navigateTo(): Promise<void> {
    await this.helpers.navigateTo('/the-vault')
    await this.waitForReady()
  }

  /**
   * Perform a search
   */
  async search(query: string): Promise<void> {
    await this.helpers.fillField(this.selectors.searchInput, query)
    await this.helpers.clickAndWait(this.selectors.searchButton)
    await this.waitForReady()
  }

  /**
   * Select a filter option
   */
  async selectFilter(option: string): Promise<void> {
    await this.helpers.selectOption(this.selectors.filterDropdown, option)
    await this.waitForReady()
  }

  /**
   * Select a sort option
   */
  async selectSort(option: string): Promise<void> {
    await this.helpers.selectOption(this.selectors.sortDropdown, option)
    await this.waitForReady()
  }

  /**
   * Click on a letter filter
   */
  async clickLetterFilter(letter: string): Promise<void> {
    const letterButton = this.page.locator(`${this.selectors.letterFilter}[data-letter="${letter}"]`)
    await letterButton.click()
    await this.waitForReady()
  }

  /**
   * Get the number of perfume cards displayed
   */
  async getPerfumeCardCount(): Promise<number> {
    return await this.page.locator(this.selectors.perfumeCards).count()
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
   * Get perfume card title
   */
  async getPerfumeCardTitle(index: number): Promise<string> {
    const title = this.page.locator(this.selectors.perfumeCardTitle).nth(index)
    return await title.textContent() || ''
  }

  /**
   * Click wishlist button on a perfume card
   */
  async clickWishlistButton(index: number): Promise<void> {
    const wishlistBtn = this.page.locator(this.selectors.wishlistButton).nth(index)
    await wishlistBtn.click()
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
   * Check if load more button is visible
   */
  async hasLoadMoreButton(): Promise<boolean> {
    return await this.helpers.elementExists(this.selectors.loadMoreButton)
  }

  /**
   * Check if no results message is visible
   */
  async hasNoResultsMessage(): Promise<boolean> {
    return await this.helpers.elementExists(this.selectors.noResultsMessage)
  }

  /**
   * Get results count
   */
  async getResultsCount(): Promise<string> {
    const element = this.page.locator(this.selectors.resultsCount)
    return await element.textContent() || ''
  }

  /**
   * Wait for perfumes to load
   */
  async waitForPerfumesToLoad(): Promise<void> {
    await this.helpers.waitForClickable(this.selectors.perfumeCards)
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoadingComplete(): Promise<void> {
    await this.helpers.waitForLoadingToComplete()
    // Wait for loading spinner to disappear
    try {
      await this.page.waitForSelector(this.selectors.loadingSpinner, { state: 'hidden', timeout: 5000 })
    } catch {
      // Ignore if spinner doesn't exist
    }
  }

  /**
   * Assert page is loaded correctly
   */
  async assertPageLoaded(): Promise<void> {
    await this.helpers.assertVisible(this.selectors.searchInput)
    await this.helpers.assertVisible(this.selectors.filterDropdown)
  }

  /**
   * Assert search results are displayed
   */
  async assertSearchResults(): Promise<void> {
    const count = await this.getPerfumeCardCount()
    expect(count).toBeGreaterThan(0)
  }

  /**
   * Assert no results message is shown
   */
  async assertNoResults(): Promise<void> {
    await this.helpers.assertVisible(this.selectors.noResultsMessage)
  }

  /**
   * Assert specific perfume is in results
   */
  async assertPerfumeInResults(perfumeName: string): Promise<void> {
    const titles = await this.page.locator(this.selectors.perfumeCardTitle).allTextContents()
    expect(titles).toContain(perfumeName)
  }
}
