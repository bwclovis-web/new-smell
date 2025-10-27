import { expect, test } from '@playwright/test'

import { HomePage } from './pages/HomePage'

test.describe('Basic Application Functionality', () => {
  let homePage: HomePage

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page)
    await homePage.navigateTo()
  })

  test('should load the home page successfully', async () => {
    // Check that the page loads without errors
    const errors = await homePage.checkForErrors()
    expect(errors).toHaveLength(0)

    // Check page title
    const title = await homePage.getTitle()
    expect(title).toBeTruthy()
    expect(title.length).toBeGreaterThan(0)

    // Check that main elements are visible
    await homePage.assertPageLoaded()
  })

  test('should have working navigation', async () => {
    // Check that navigation is visible
    const isNavVisible = await homePage.isNavigationVisible()
    expect(isNavVisible).toBe(true)

    // Check that hero section is visible
    const isHeroVisible = await homePage.isHeroSectionVisible()
    expect(isHeroVisible).toBe(true)
  })

  test('should handle page interactions without errors', async () => {
    // Wait for the page to be fully loaded
    await homePage.waitForReady()

    // Check for console errors after page load
    const errors = await homePage.checkForErrors()
    expect(errors).toHaveLength(0)

    // Take a screenshot for visual verification
    await homePage.takeScreenshot('home-page-loaded')
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Navigate and wait for load
    await homePage.navigateTo()
    await homePage.waitForReady()

    // Check that page still loads correctly on mobile
    const isNavVisible = await homePage.isNavigationVisible()
    expect(isNavVisible).toBe(true)

    // Take mobile screenshot
    await homePage.takeScreenshot('home-page-mobile')
  })
})
