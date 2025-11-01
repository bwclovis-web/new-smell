/**
 * Critical User Flows E2E Tests
 * 
 * Tests essential user journeys through the application:
 * - Authentication flows (sign up, login, logout)
 * - Perfume discovery and browsing
 * - Wishlist management
 * - User collection management
 * 
 * These tests ensure core user functionality works end-to-end.
 * 
 * @group e2e
 * @group critical
 */

import { expect, test } from '@playwright/test'

import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { PerfumePage } from './pages/PerfumePage'
import { SignUpPage } from './pages/SignUpPage'
import { VaultPage } from './pages/VaultPage'

test.describe('Critical User Flows', () => {
  test.describe('Authentication Flows', () => {
    test('should allow user to sign up with valid credentials', async ({ page }) => {
      const signUpPage = new SignUpPage(page)
      await signUpPage.navigateTo()

      // Fill sign up form
      await signUpPage.signUp({
        email: 'test@example.com',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      })

      // Should redirect to home page or dashboard
      await expect(page).toHaveURL(/\/(?!login)/)
    })

    test('should allow user to login with valid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()

      // Fill login form
      await loginPage.login('test@example.com', 'TestPassword123!')

      // Should redirect to home page or dashboard
      await expect(page).toHaveURL(/\/(?!login)/)
    })

    test('should show error for invalid login credentials', async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()

      // Try to login with invalid credentials
      await loginPage.login('invalid@example.com', 'wrongpassword')

      // Should show error message
      await expect(loginPage.hasErrorMessage()).resolves.toBe(true)
    })

    test('should validate password strength during sign up', async ({ page }) => {
      const signUpPage = new SignUpPage(page)
      await signUpPage.navigateTo()

      // Fill form with weak password
      await signUpPage.fillForm({
        email: 'test@example.com',
        password: '123',
        confirmPassword: '123',
        firstName: 'Test',
        lastName: 'User'
      })

      // Check password strength indicator
      const strength = await signUpPage.getPasswordStrength()
      expect(strength).toContain('weak')
    })
  })

  test.describe('Perfume Browsing Flows', () => {
    test('should allow user to browse perfumes in the vault', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()

      // Check that perfumes are loaded
      await vaultPage.waitForPerfumesToLoad()
      const count = await vaultPage.getPerfumeCardCount()
      expect(count).toBeGreaterThan(0)

      // Take screenshot for visual verification
      await vaultPage.takeScreenshot('vault-page-loaded')
    })

    test('should allow user to search for perfumes', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()

      // Perform search
      await vaultPage.search('rose')

      // Wait for results
      await vaultPage.waitForLoadingComplete()

      // Check that results are displayed
      const count = await vaultPage.getPerfumeCardCount()
      expect(count).toBeGreaterThan(0)
    })

    test('should allow user to filter perfumes by letter', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()

      // Click on letter filter
      await vaultPage.clickLetterFilter('A')

      // Wait for filtered results
      await vaultPage.waitForLoadingComplete()

      // Check that results are displayed
      const count = await vaultPage.getPerfumeCardCount()
      expect(count).toBeGreaterThan(0)
    })

    test('should allow user to sort perfumes', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()

      // Select sort option
      await vaultPage.selectSort('name-asc')

      // Wait for sorted results
      await vaultPage.waitForLoadingComplete()

      // Check that results are displayed
      const count = await vaultPage.getPerfumeCardCount()
      expect(count).toBeGreaterThan(0)
    })

    test('should show no results message for invalid search', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()

      // Search for something that doesn't exist
      await vaultPage.search('nonexistentperfume12345')

      // Wait for no results
      await vaultPage.waitForLoadingComplete()

      // Check that no results message is shown
      await expect(vaultPage.hasNoResultsMessage()).resolves.toBe(true)
    })
  })

  test.describe('Perfume Detail Flows', () => {
    test('should allow user to view perfume details', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      // Navigate to vault
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      // Click on first perfume
      await vaultPage.clickPerfumeCard(0)

      // Check that perfume page loads
      await perfumePage.waitForPerfumeData()
      await perfumePage.assertPageLoaded()

      // Check that perfume details are displayed
      const name = await perfumePage.getPerfumeName()
      expect(name).toBeTruthy()
    })

    test('should allow user to add perfume to wishlist', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      // Navigate to vault and click on perfume
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      // Wait for perfume page to load
      await perfumePage.waitForPerfumeData()

      // Click wishlist button
      await perfumePage.clickWishlistButton()

      // Check that wishlist state changed
      const isInWishlist = await perfumePage.isInWishlist()
      expect(isInWishlist).toBe(true)
    })

    test('should allow user to rate a perfume', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      // Navigate to vault and click on perfume
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      // Wait for perfume page to load
      await perfumePage.waitForPerfumeData()

      // Rate the perfume
      await perfumePage.ratePerfume(5)

      // Check that rating is displayed
      await perfumePage.assertRatingDisplayed(5)
    })
  })

  test.describe('Navigation Flows', () => {
    test('should allow user to navigate between pages', async ({ page }) => {
      const homePage = new HomePage(page)
      const vaultPage = new VaultPage(page)

      // Start at home page
      await homePage.navigateTo()
      await homePage.assertPageLoaded()

      // Navigate to vault
      await vaultPage.navigateTo()
      await vaultPage.assertPageLoaded()

      // Navigate back to home
      await homePage.navigateTo()
      await homePage.assertPageLoaded()
    })

    test('should maintain state when navigating back', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      // Navigate to vault and perform search
      await vaultPage.navigateTo()
      await vaultPage.search('rose')
      await vaultPage.waitForLoadingComplete()

      // Click on a perfume
      await vaultPage.clickPerfumeCard(0)
      await perfumePage.waitForPerfumeData()

      // Navigate back
      await perfumePage.clickBack()

      // Check that we're back at vault with search results
      await vaultPage.assertPageLoaded()
    })
  })

  test.describe('Error Handling Flows', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort())

      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()

      // Should still show the page even if API fails
      await vaultPage.assertPageLoaded()
    })

    test('should show appropriate error messages', async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()

      // Try to login with invalid credentials
      await loginPage.login('invalid@example.com', 'wrongpassword')

      // Should show error message
      await expect(loginPage.hasErrorMessage()).resolves.toBe(true)
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test('should work correctly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      const homePage = new HomePage(page)
      const vaultPage = new VaultPage(page)

      // Test home page on mobile
      await homePage.navigateTo()
      await homePage.assertPageLoaded()

      // Test vault page on mobile
      await vaultPage.navigateTo()
      await vaultPage.assertPageLoaded()

      // Take mobile screenshot
      await vaultPage.takeScreenshot('vault-page-mobile')
    })
  })
})
