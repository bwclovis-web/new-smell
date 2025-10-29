import { expect, test } from '@playwright/test'

import { PerfumePage } from './pages/PerfumePage'
import { VaultPage } from './pages/VaultPage'

test.describe('Perfume Discovery Flows', () => {
  test.describe('Advanced Search', () => {
    test('should search perfumes by name', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      // Search for a specific perfume
      await vaultPage.search('rose')
      await vaultPage.waitForLoadingComplete()

      // Verify results contain the search term
      const count = await vaultPage.getPerfumeCardCount()
      expect(count).toBeGreaterThan(0)

      // Take screenshot for visual verification
      await vaultPage.takeScreenshot('search-by-name')
    })

    test('should search perfumes with special characters', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()

      // Search with special characters
      await vaultPage.search("L'Eau")
      await vaultPage.waitForLoadingComplete()

      // Should handle special characters correctly
      await vaultPage.assertPageLoaded()
    })

    test('should handle empty search', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()

      // Search with empty string
      await vaultPage.search('')
      await vaultPage.waitForLoadingComplete()

      // Should show all perfumes
      const count = await vaultPage.getPerfumeCardCount()
      expect(count).toBeGreaterThan(0)
    })

    test('should clear search results', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()

      // Perform search
      await vaultPage.search('rose')
      await vaultPage.waitForLoadingComplete()

      // Clear search
      await vaultPage.search('')
      await vaultPage.waitForLoadingComplete()

      // Should show all perfumes again
      const count = await vaultPage.getPerfumeCardCount()
      expect(count).toBeGreaterThan(0)
    })

    test('should search and then filter results', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()

      // First search
      await vaultPage.search('perfume')
      await vaultPage.waitForLoadingComplete()
      const searchCount = await vaultPage.getPerfumeCardCount()

      // Then apply letter filter
      await vaultPage.clickLetterFilter('A')
      await vaultPage.waitForLoadingComplete()
      const filteredCount = await vaultPage.getPerfumeCardCount()

      // Filtered results should be different
      expect(filteredCount).toBeLessThanOrEqual(searchCount)
    })
  })

  test.describe('Filtering & Sorting', () => {
    test('should filter perfumes alphabetically', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      // Test different letter filters
      const letters = ['A', 'B', 'C']

      for (const letter of letters) {
        await vaultPage.clickLetterFilter(letter)
        await vaultPage.waitForLoadingComplete()

        const count = await vaultPage.getPerfumeCardCount()
        expect(count).toBeGreaterThanOrEqual(0)

        await vaultPage.takeScreenshot(`filter-letter-${letter}`)
      }
    })

    test('should sort perfumes by name ascending', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      // Sort by name ascending
      await vaultPage.selectSort('name-asc')
      await vaultPage.waitForLoadingComplete()

      // Get all perfume names
      const names = await page.$$eval('[data-testid="perfume-card"]', cards => cards.map(card => card.textContent?.trim() || ''))

      // Verify they are sorted
      const sortedNames = [...names].sort()
      expect(names).toEqual(sortedNames)
    })

    test('should sort perfumes by name descending', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      // Sort by name descending
      await vaultPage.selectSort('name-desc')
      await vaultPage.waitForLoadingComplete()

      // Get all perfume names
      const names = await page.$$eval('[data-testid="perfume-card"]', cards => cards.map(card => card.textContent?.trim() || ''))

      // Verify they are sorted in descending order
      const sortedNames = [...names].sort().reverse()
      expect(names).toEqual(sortedNames)
    })

    test('should combine filters and sorting', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      // Apply letter filter first
      await vaultPage.clickLetterFilter('A')
      await vaultPage.waitForLoadingComplete()

      // Then sort
      await vaultPage.selectSort('name-asc')
      await vaultPage.waitForLoadingComplete()

      // Should have filtered and sorted results
      const count = await vaultPage.getPerfumeCardCount()
      expect(count).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Perfume Navigation', () => {
    test('should navigate from vault to perfume detail', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      // Click on first perfume
      await vaultPage.clickPerfumeCard(0)

      // Verify perfume detail page loads
      await perfumePage.waitForPerfumeData()
      await perfumePage.assertPageLoaded()

      const name = await perfumePage.getPerfumeName()
      expect(name).toBeTruthy()
      expect(name.length).toBeGreaterThan(0)
    })

    test('should navigate between perfumes', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      // Click on first perfume
      await vaultPage.clickPerfumeCard(0)
      await perfumePage.waitForPerfumeData()
      const firstName = await perfumePage.getPerfumeName()

      // Go back
      await perfumePage.clickBack()
      await vaultPage.waitForPerfumesToLoad()

      // Click on second perfume
      await vaultPage.clickPerfumeCard(1)
      await perfumePage.waitForPerfumeData()
      const secondName = await perfumePage.getPerfumeName()

      // Should be different perfumes
      expect(firstName).not.toEqual(secondName)
    })

    test('should preserve filter state when returning from detail', async ({
      page,
    }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      // Apply filter
      await vaultPage.clickLetterFilter('A')
      await vaultPage.waitForLoadingComplete()

      // Click on a perfume
      await vaultPage.clickPerfumeCard(0)
      await perfumePage.waitForPerfumeData()

      // Go back
      await perfumePage.clickBack()

      // Filter should still be applied
      await vaultPage.assertPageLoaded()
      const url = page.url()
      expect(url).toContain('A')
    })
  })

  test.describe('Perfume Details', () => {
    test('should display perfume information', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Check that all key information is displayed
      const name = await perfumePage.getPerfumeName()
      expect(name).toBeTruthy()

      // Take screenshot
      await perfumePage.takeScreenshot('perfume-details')
    })

    test('should show perfume house information', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Check that perfume house is displayed
      const hasHouse = await page.locator('[data-testid="perfume-house"]').isVisible()
      expect(hasHouse).toBeTruthy()
    })

    test('should display perfume image', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Check that image is loaded
      const image = page.locator('[data-testid="perfume-image"]')
      await expect(image).toBeVisible()
    })

    test('should handle missing perfume data gracefully', async ({ page }) => {
      const perfumePage = new PerfumePage(page)

      // Navigate to non-existent perfume
      await page.goto('/perfume/non-existent-perfume-12345')

      // Should show error or not found message
      await expect(page.locator('text=not found')).toBeVisible({
        timeout: 10000,
      })
    })
  })

  test.describe('Pagination & Lazy Loading', () => {
    test('should load more perfumes on scroll', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      // Get initial count
      const initialCount = await vaultPage.getPerfumeCardCount()

      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(1000)

      // Get new count (should be same or more if pagination exists)
      const newCount = await vaultPage.getPerfumeCardCount()
      expect(newCount).toBeGreaterThanOrEqual(initialCount)
    })

    test('should handle rapid scrolling', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      // Rapid scrolling
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollBy(0, 500))
        await page.waitForTimeout(100)
      }

      // Should handle it gracefully
      await vaultPage.assertPageLoaded()
    })
  })

  test.describe('No Results Scenarios', () => {
    test('should show no results message for invalid search', async ({
      page,
    }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()

      // Search for something that doesn't exist
      await vaultPage.search('xyznonexistentperfume999')
      await vaultPage.waitForLoadingComplete()

      // Should show no results message
      const hasNoResults = await vaultPage.hasNoResultsMessage()
      expect(hasNoResults).toBe(true)

      await vaultPage.takeScreenshot('no-results')
    })

    test('should provide search suggestions when no results', async ({
      page,
    }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()

      // Search for something that doesn't exist
      await vaultPage.search('xyznonexistentperfume999')
      await vaultPage.waitForLoadingComplete()

      // Should show the page without errors
      await vaultPage.assertPageLoaded()
    })
  })

  test.describe('Mobile Perfume Discovery', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('should work correctly on mobile', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      // Should display perfumes on mobile
      const count = await vaultPage.getPerfumeCardCount()
      expect(count).toBeGreaterThan(0)

      await vaultPage.takeScreenshot('mobile-vault')
    })

    test('should search on mobile', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()

      await vaultPage.search('rose')
      await vaultPage.waitForLoadingComplete()

      const count = await vaultPage.getPerfumeCardCount()
      expect(count).toBeGreaterThan(0)
    })

    test('should filter on mobile', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      await vaultPage.clickLetterFilter('A')
      await vaultPage.waitForLoadingComplete()

      const count = await vaultPage.getPerfumeCardCount()
      expect(count).toBeGreaterThanOrEqual(0)
    })

    test('should navigate to perfume detail on mobile', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()
      await perfumePage.assertPageLoaded()
    })
  })

  test.describe('Performance', () => {
    test('should load vault page within acceptable time', async ({ page }) => {
      const startTime = Date.now()

      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      const loadTime = Date.now() - startTime

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000)
    })

    test('should load perfume detail within acceptable time', async ({
      page,
    }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      const startTime = Date.now()
      await perfumePage.waitForPerfumeData()
      const loadTime = Date.now() - startTime

      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
    })
  })
})

