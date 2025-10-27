import { expect, test } from '@playwright/test'

import { AdminPage } from './pages/AdminPage'
import { LoginPage } from './pages/LoginPage'
import { VaultPage } from './pages/VaultPage'

test.describe('Admin Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user before each test
    const loginPage = new LoginPage(page)
    await loginPage.navigateTo()

    // Use admin credentials (you may need to adjust these based on your test data)
    await loginPage.login('admin@example.com', 'AdminPassword123!')

    // Verify login was successful
    await expect(page).toHaveURL(/\/(?!login)/)
  })

  test('should allow admin to access admin dashboard', async ({ page }) => {
    const adminPage = new AdminPage(page)
    await adminPage.navigateTo()

    // Check that admin dashboard is visible
    await adminPage.assertDashboardLoaded()
  })

  test('should allow admin to navigate to security monitor', async ({ page }) => {
    const adminPage = new AdminPage(page)
    await adminPage.navigateTo()

    // Navigate to security monitor
    await adminPage.navigateToSecurityMonitor()

    // Check that security monitor page loads
    await expect(page).toHaveURL(/security-monitor/)
  })

  test('should allow admin to navigate to data quality', async ({ page }) => {
    const adminPage = new AdminPage(page)
    await adminPage.navigateTo()

    // Navigate to data quality
    await adminPage.navigateToDataQuality()

    // Check that data quality page loads
    await expect(page).toHaveURL(/data-quality/)
  })

  test('should allow admin to create new perfume', async ({ page }) => {
    const adminPage = new AdminPage(page)
    await adminPage.navigateTo()

    // Click create perfume button
    await adminPage.clickCreatePerfume()

    // Check that create perfume page loads
    await expect(page).toHaveURL(/create-perfume/)
  })

  test('should allow admin to create new perfume house', async ({ page }) => {
    const adminPage = new AdminPage(page)
    await adminPage.navigateTo()

    // Click create house button
    await adminPage.clickCreateHouse()

    // Check that create house page loads
    await expect(page).toHaveURL(/create-house/)
  })

  test('should redirect non-admin users from admin pages', async ({ page }) => {
    // Login as regular user
    const loginPage = new LoginPage(page)
    await loginPage.navigateTo()
    await loginPage.login('user@example.com', 'UserPassword123!')

    // Try to access admin page
    await page.goto('/admin')

    // Should be redirected away from admin page
    await expect(page).toHaveURL(/\/(?!admin)/)
  })

  test('should allow admin to logout', async ({ page }) => {
    const adminPage = new AdminPage(page)
    await adminPage.navigateTo()

    // Click logout
    await adminPage.clickLogout()

    // Should be redirected to login page
    await expect(page).toHaveURL(/login/)
  })
})
