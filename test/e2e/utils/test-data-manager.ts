import { Page } from "@playwright/test"

import testData from "../fixtures/test-data.json"

/**
 * Test data manager for E2E tests
 */
export class TestDataManager {
  private page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Get user data by type
   */
  getUserData(userType: "admin" | "regular" | "newUser") {
    return testData.users[userType]
  }

  /**
   * Get perfume data by name
   */
  getPerfumeData(perfumeName: keyof typeof testData.perfumes) {
    return testData.perfumes[perfumeName]
  }

  /**
   * Get perfume house data by name
   */
  getHouseData(houseName: keyof typeof testData.perfumeHouses) {
    return testData.perfumeHouses[houseName]
  }

  /**
   * Get search queries by type
   */
  getSearchQueries(type: "valid" | "invalid" | "specialCharacters") {
    return testData.searchQueries[type]
  }

  /**
   * Get valid ratings
   */
  getValidRatings() {
    return testData.ratings.valid
  }

  /**
   * Get invalid ratings
   */
  getInvalidRatings() {
    return testData.ratings.invalid
  }

  /**
   * Get URL by name
   */
  getUrl(urlName: keyof typeof testData.urls) {
    return testData.urls[urlName]
  }

  /**
   * Generate random email for testing
   */
  generateRandomEmail(): string {
    const timestamp = Date.now()
    return `test-${timestamp}@example.com`
  }

  /**
   * Generate random perfume name for testing
   */
  generateRandomPerfumeName(): string {
    const timestamp = Date.now()
    return `Test Perfume ${timestamp}`
  }

  /**
   * Generate random house name for testing
   */
  generateRandomHouseName(): string {
    const timestamp = Date.now()
    return `Test House ${timestamp}`
  }

  /**
   * Get test user credentials
   */
  getTestCredentials(userType: "admin" | "regular" | "newUser") {
    const user = this.getUserData(userType)
    return {
      email: user.email,
      password: user.password,
    }
  }

  /**
   * Get test perfume data for creation
   */
  getTestPerfumeData() {
    return {
      name: this.generateRandomPerfumeName(),
      house: this.generateRandomHouseName(),
      description: "A test perfume created during E2E testing",
      notes: ["rose", "jasmine", "sandalwood"],
      image: "/images/test-perfume.webp",
    }
  }

  /**
   * Get test house data for creation
   */
  getTestHouseData() {
    return {
      name: this.generateRandomHouseName(),
      description: "A test perfume house created during E2E testing",
      country: "France",
      founded: "2020",
      image: "/images/test-house.webp",
    }
  }

  /**
   * Clean up test data (if needed)
   */
  async cleanupTestData(): Promise<void> {
    // This would typically involve API calls to clean up test data
    // For now, we'll just log that cleanup would happen
    console.log("Cleaning up test data...")
  }

  /**
   * Setup test data (if needed)
   */
  async setupTestData(): Promise<void> {
    // This would typically involve API calls to set up test data
    // For now, we'll just log that setup would happen
    console.log("Setting up test data...")
  }
}
