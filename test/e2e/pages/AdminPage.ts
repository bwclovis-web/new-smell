import { Page } from '@playwright/test'

import { BasePage } from './BasePage'

/**
 * Admin page object model
 */
export class AdminPage extends BasePage {
  // Selectors
  private readonly selectors = {
    adminDashboard: '[data-testid="admin-dashboard"]',
    createPerfumeButton: '[data-testid="create-perfume-button"]',
    createHouseButton: '[data-testid="create-house-button"]',
    perfumeList: '[data-testid="perfume-list"]',
    houseList: '[data-testid="house-list"]',
    editButton: '[data-testid="edit-button"]',
    deleteButton: '[data-testid="delete-button"]',
    confirmDeleteButton: '[data-testid="confirm-delete"]',
    securityMonitor: '[data-testid="security-monitor"]',
    dataQuality: '[data-testid="data-quality"]',
    userManagement: '[data-testid="user-management"]',
    navigation: '[data-testid="admin-navigation"]',
    logoutButton: '[data-testid="logout-button"]'
  }

  constructor(page: Page) {
    super(page)
  }

  /**
   * Navigate to admin dashboard
   */
  async navigateTo(): Promise<void> {
    await this.helpers.navigateTo('/admin')
    await this.waitForReady()
  }

  /**
   * Check if admin dashboard is visible
   */
  async isDashboardVisible(): Promise<boolean> {
    return await this.helpers.elementExists(this.selectors.adminDashboard)
  }

  /**
   * Click create perfume button
   */
  async clickCreatePerfume(): Promise<void> {
    await this.helpers.clickAndWait(this.selectors.createPerfumeButton, true)
    await this.waitForReady()
  }

  /**
   * Click create house button
   */
  async clickCreateHouse(): Promise<void> {
    await this.helpers.clickAndWait(this.selectors.createHouseButton, true)
    await this.waitForReady()
  }

  /**
   * Navigate to security monitor
   */
  async navigateToSecurityMonitor(): Promise<void> {
    await this.helpers.clickAndWait(this.selectors.securityMonitor, true)
    await this.waitForReady()
  }

  /**
   * Navigate to data quality
   */
  async navigateToDataQuality(): Promise<void> {
    await this.helpers.clickAndWait(this.selectors.dataQuality, true)
    await this.waitForReady()
  }

  /**
   * Navigate to user management
   */
  async navigateToUserManagement(): Promise<void> {
    await this.helpers.clickAndWait(this.selectors.userManagement, true)
    await this.waitForReady()
  }

  /**
   * Click logout button
   */
  async clickLogout(): Promise<void> {
    await this.helpers.clickAndWait(this.selectors.logoutButton, true)
    await this.waitForReady()
  }

  /**
   * Assert admin dashboard is loaded
   */
  async assertDashboardLoaded(): Promise<void> {
    await this.helpers.assertVisible(this.selectors.adminDashboard)
    await this.helpers.assertVisible(this.selectors.navigation)
  }
}
