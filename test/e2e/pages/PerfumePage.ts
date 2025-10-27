import { Page } from '@playwright/test'

import { BasePage } from './BasePage'

/**
 * Individual perfume page object model
 */
export class PerfumePage extends BasePage {
  // Selectors
  private readonly selectors = {
    perfumeName: '[data-testid="perfume-name"]',
    perfumeHouse: '[data-testid="perfume-house"]',
    perfumeImage: '[data-testid="perfume-image"]',
    perfumeDescription: '[data-testid="perfume-description"]',
    perfumeNotes: '[data-testid="perfume-notes"]',
    ratingSection: '[data-testid="rating-section"]',
    ratingStars: '[data-testid="rating-stars"]',
    ratingInput: '[data-testid="rating-input"]',
    submitRatingButton: '[data-testid="submit-rating"]',
    wishlistButton: '[data-testid="wishlist-button"]',
    backButton: '[data-testid="back-button"]',
    editButton: '[data-testid="edit-button"]',
    deleteButton: '[data-testid="delete-button"]',
    confirmDeleteButton: '[data-testid="confirm-delete"]',
    averageRating: '[data-testid="average-rating"]',
    ratingCount: '[data-testid="rating-count"]',
    userRating: '[data-testid="user-rating"]',
    loadingSpinner: '[data-testid="loading-spinner"]',
    errorMessage: '[data-testid="error-message"]',
    successMessage: '[data-testid="success-message"]'
  }

  constructor(page: Page) {
    super(page)
  }

  /**
   * Navigate to a specific perfume page
   */
  async navigateTo(perfumeId: string): Promise<void> {
    await this.helpers.navigateTo(`/perfume/${perfumeId}`)
    await this.waitForReady()
  }

  /**
   * Get perfume name
   */
  async getPerfumeName(): Promise<string> {
    const element = this.page.locator(this.selectors.perfumeName)
    return await element.textContent() || ''
  }

  /**
   * Get perfume house name
   */
  async getPerfumeHouse(): Promise<string> {
    const element = this.page.locator(this.selectors.perfumeHouse)
    return await element.textContent() || ''
  }

  /**
   * Get perfume description
   */
  async getPerfumeDescription(): Promise<string> {
    const element = this.page.locator(this.selectors.perfumeDescription)
    return await element.textContent() || ''
  }

  /**
   * Get perfume notes
   */
  async getPerfumeNotes(): Promise<string[]> {
    const elements = await this.page.locator(this.selectors.perfumeNotes).allTextContents()
    return elements
  }

  /**
   * Click wishlist button
   */
  async clickWishlistButton(): Promise<void> {
    await this.helpers.clickAndWait(this.selectors.wishlistButton)
    await this.waitForReady()
  }

  /**
   * Check if perfume is in wishlist
   */
  async isInWishlist(): Promise<boolean> {
    const button = this.page.locator(this.selectors.wishlistButton)
    const text = await button.textContent()
    return text?.includes('Remove') || text?.includes('Added') || false
  }

  /**
   * Rate the perfume
   */
  async ratePerfume(rating: number): Promise<void> {
    // Click on the star rating
    const star = this.page.locator(`${this.selectors.ratingStars} [data-rating="${rating}"]`)
    await star.click()
    await this.waitForReady()
  }

  /**
   * Submit rating with comment
   */
  async submitRating(rating: number, comment?: string): Promise<void> {
    await this.ratePerfume(rating)

    if (comment) {
      await this.helpers.fillField(this.selectors.ratingInput, comment)
    }

    await this.helpers.clickAndWait(this.selectors.submitRatingButton)
    await this.waitForReady()
  }

  /**
   * Get average rating
   */
  async getAverageRating(): Promise<string> {
    const element = this.page.locator(this.selectors.averageRating)
    return await element.textContent() || ''
  }

  /**
   * Get rating count
   */
  async getRatingCount(): Promise<string> {
    const element = this.page.locator(this.selectors.ratingCount)
    return await element.textContent() || ''
  }

  /**
   * Get user's current rating
   */
  async getUserRating(): Promise<string> {
    const element = this.page.locator(this.selectors.userRating)
    return await element.textContent() || ''
  }

  /**
   * Click back button
   */
  async clickBack(): Promise<void> {
    await this.helpers.clickAndWait(this.selectors.backButton, true)
    await this.waitForReady()
  }

  /**
   * Click edit button (admin only)
   */
  async clickEdit(): Promise<void> {
    await this.helpers.clickAndWait(this.selectors.editButton, true)
    await this.waitForReady()
  }

  /**
   * Click delete button (admin only)
   */
  async clickDelete(): Promise<void> {
    await this.helpers.clickAndWait(this.selectors.deleteButton)
    await this.waitForReady()
  }

  /**
   * Confirm deletion
   */
  async confirmDelete(): Promise<void> {
    await this.helpers.clickAndWait(this.selectors.confirmDeleteButton, true)
    await this.waitForReady()
  }

  /**
   * Check if error message is visible
   */
  async hasErrorMessage(): Promise<boolean> {
    return await this.helpers.elementExists(this.selectors.errorMessage)
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    const element = this.page.locator(this.selectors.errorMessage)
    return await element.textContent() || ''
  }

  /**
   * Check if success message is visible
   */
  async hasSuccessMessage(): Promise<boolean> {
    return await this.helpers.elementExists(this.selectors.successMessage)
  }

  /**
   * Wait for perfume data to load
   */
  async waitForPerfumeData(): Promise<void> {
    await this.helpers.waitForClickable(this.selectors.perfumeName)
    await this.helpers.waitForClickable(this.selectors.perfumeImage)
  }

  /**
   * Assert perfume page is loaded correctly
   */
  async assertPageLoaded(): Promise<void> {
    await this.helpers.assertVisible(this.selectors.perfumeName)
    await this.helpers.assertVisible(this.selectors.perfumeImage)
    await this.helpers.assertVisible(this.selectors.ratingSection)
  }

  /**
   * Assert perfume name matches expected
   */
  async assertPerfumeName(expectedName: string): Promise<void> {
    await this.helpers.assertText(this.selectors.perfumeName, expectedName)
  }

  /**
   * Assert wishlist button state
   */
  async assertWishlistState(isInWishlist: boolean): Promise<void> {
    const buttonText = await this.page.locator(this.selectors.wishlistButton).textContent()
    if (isInWishlist) {
      expect(buttonText).toContain('Remove')
    } else {
      expect(buttonText).toContain('Add')
    }
  }

  /**
   * Assert rating is displayed
   */
  async assertRatingDisplayed(rating: number): Promise<void> {
    const userRating = await this.getUserRating()
    expect(userRating).toContain(rating.toString())
  }
}
