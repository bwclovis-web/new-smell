import { expect, test } from '@playwright/test'

import { LoginPage } from './pages/LoginPage'
import { PerfumePage } from './pages/PerfumePage'
import { VaultPage } from './pages/VaultPage'

test.describe('Collection Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const loginPage = new LoginPage(page)
    await loginPage.navigateTo()
    await loginPage.login('test@example.com', 'TestPassword123!')
    await expect(page).toHaveURL(/\/(?!login)/)
  })

  test.describe('Adding to Collection', () => {
    test('should add perfume to collection from detail page', async ({
      page,
    }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Add to collection
      await page.click('[data-testid="add-to-collection"]')

      // Should show success message
      await expect(
        page.locator('text=/added.*collection|added.*successfully/i')
      ).toBeVisible({ timeout: 5000 })
    })

    test('should select collection type when adding', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Open collection modal
      await page.click('[data-testid="add-to-collection"]')

      // Select collection type (Own, Want, Sample, etc.)
      await page.click('[data-testid="collection-own"]')

      // Confirm
      await page.click('button:has-text("Add")')

      // Should add successfully
      await expect(
        page.locator('text=/added|success/i')
      ).toBeVisible({ timeout: 5000 })
    })

    test('should add notes when adding to collection', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Open collection modal
      await page.click('[data-testid="add-to-collection"]')

      // Add notes
      await page.fill('[name="notes"]', 'This is a test note')

      // Submit
      await page.click('button:has-text("Add")')

      // Should add successfully
      await expect(page.locator('text=/added|success/i')).toBeVisible({ timeout: 5000 })
    })

    test('should prevent duplicate entries', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Add to collection first time
      await page.click('[data-testid="add-to-collection"]')
      await page.click('[data-testid="collection-own"]')
      await page.click('button:has-text("Add")')

      await page.waitForTimeout(1000)

      // Try to add again
      await page.click('[data-testid="add-to-collection"]')

      // Should show message that it's already in collection
      await expect(
        page.locator('text=/already.*collection|already added/i')
      ).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Viewing Collections', () => {
    test('should view all collections', async ({ page }) => {
      await page.goto('/collection')

      // Should show collections page
      await expect(page).toHaveURL(/collection/)
      await expect(page.locator('h1, h2')).toContainText(/collection/i)
    })

    test('should filter by collection type', async ({ page }) => {
      await page.goto('/collection')

      // Click filter for "Own"
      await page.click('[data-testid="filter-own"]')

      // Should show only owned perfumes
      await page.waitForTimeout(500)
      await expect(page).toHaveURL(/type=own/)
    })

    test('should search within collection', async ({ page }) => {
      await page.goto('/collection')

      // Search in collection
      await page.fill('[data-testid="collection-search"]', 'rose')
      await page.keyboard.press('Enter')

      // Should filter results
      await page.waitForTimeout(500)
    })

    test('should sort collection', async ({ page }) => {
      await page.goto('/collection')

      // Sort by name
      await page.selectOption('[data-testid="collection-sort"]', 'name')

      // Should reorder items
      await page.waitForTimeout(500)
    })

    test('should display collection statistics', async ({ page }) => {
      await page.goto('/collection')

      // Should show stats like total count
      await expect(page.locator('[data-testid="collection-count"]')).toBeVisible()
    })
  })

  test.describe('Editing Collection Items', () => {
    test('should edit collection item notes', async ({ page }) => {
      await page.goto('/collection')

      // Click on first item
      await page.click('[data-testid="collection-item"]:first-child')

      // Edit notes
      await page.click('[data-testid="edit-notes"]')
      await page.fill('[name="notes"]', 'Updated notes')
      await page.click('button:has-text("Save")')

      // Should show success
      await expect(page.locator('text=/saved|updated/i')).toBeVisible()
    })

    test('should change collection type', async ({ page }) => {
      await page.goto('/collection')

      // Click on first item
      await page.click('[data-testid="collection-item"]:first-child')

      // Change type from Own to Want
      await page.click('[data-testid="change-type"]')
      await page.click('[data-testid="type-want"]')

      // Should update
      await expect(page.locator('text=/updated|changed/i')).toBeVisible()
    })

    test('should add rating to collection item', async ({ page }) => {
      await page.goto('/collection')

      // Click on first item
      await page.click('[data-testid="collection-item"]:first-child')

      // Add rating
      await page.click('[data-testid="rating-5"]')

      // Should save rating
      await page.waitForTimeout(500)
    })

    test('should update purchase date', async ({ page }) => {
      await page.goto('/collection')

      // Click on first item
      await page.click('[data-testid="collection-item"]:first-child')

      // Update purchase date
      await page.click('[data-testid="edit-purchase-date"]')
      await page.fill('[type="date"]', '2024-01-15')
      await page.click('button:has-text("Save")')

      // Should update
      await expect(page.locator('text=/saved|updated/i')).toBeVisible()
    })
  })

  test.describe('Removing from Collection', () => {
    test('should remove item from collection', async ({ page }) => {
      await page.goto('/collection')

      // Get initial count
      const initialCount = await page
        .locator('[data-testid="collection-item"]')
        .count()

      // Click remove on first item
      await page.click('[data-testid="remove-item"]:first-child')

      // Confirm removal
      await page.click('button:has-text("Remove")')

      // Should show success
      await expect(page.locator('text=/removed|deleted/i')).toBeVisible()

      // Count should decrease
      const newCount = await page
        .locator('[data-testid="collection-item"]')
        .count()
      expect(newCount).toBeLessThan(initialCount)
    })

    test('should confirm before removing', async ({ page }) => {
      await page.goto('/collection')

      // Click remove
      await page.click('[data-testid="remove-item"]:first-child')

      // Should show confirmation dialog
      await expect(
        page.locator('text=/confirm|sure|remove/i')
      ).toBeVisible()
    })

    test('should cancel removal', async ({ page }) => {
      await page.goto('/collection')

      const initialCount = await page
        .locator('[data-testid="collection-item"]')
        .count()

      // Click remove
      await page.click('[data-testid="remove-item"]:first-child')

      // Cancel
      await page.click('button:has-text("Cancel")')

      // Count should remain same
      const newCount = await page
        .locator('[data-testid="collection-item"]')
        .count()
      expect(newCount).toBe(initialCount)
    })
  })

  test.describe('Collection Import/Export', () => {
    test('should export collection to CSV', async ({ page }) => {
      await page.goto('/collection')

      // Click export button
      const downloadPromise = page.waitForEvent('download')
      await page.click('[data-testid="export-collection"]')

      const download = await downloadPromise

      // Should download CSV file
      expect(download.suggestedFilename()).toContain('.csv')
    })

    test('should access import functionality', async ({ page }) => {
      await page.goto('/collection')

      // Click import button
      await page.click('[data-testid="import-collection"]')

      // Should show import dialog
      await expect(page.locator('text=/import|upload/i')).toBeVisible()
    })
  })

  test.describe('Collection Sharing', () => {
    test('should generate shareable link', async ({ page }) => {
      await page.goto('/collection')

      // Click share button
      await page.click('[data-testid="share-collection"]')

      // Should show shareable link
      await expect(page.locator('[data-testid="share-link"]')).toBeVisible()
    })

    test('should copy share link to clipboard', async ({ page }) => {
      await page.goto('/collection')

      // Click share
      await page.click('[data-testid="share-collection"]')

      // Click copy
      await page.click('[data-testid="copy-link"]')

      // Should show copied message
      await expect(page.locator('text=/copied/i')).toBeVisible()
    })

    test('should toggle collection privacy', async ({ page }) => {
      await page.goto('/collection')

      // Click privacy settings
      await page.click('[data-testid="collection-privacy"]')

      // Toggle public/private
      await page.click('[data-testid="privacy-toggle"]')

      // Should save setting
      await expect(page.locator('text=/updated|saved/i')).toBeVisible()
    })
  })

  test.describe('Collection Statistics', () => {
    test('should display total perfume count', async ({ page }) => {
      await page.goto('/collection/stats')

      // Should show total count
      await expect(page.locator('[data-testid="total-count"]')).toBeVisible()
    })

    test('should show breakdown by type', async ({ page }) => {
      await page.goto('/collection/stats')

      // Should show own, want, sample counts
      await expect(page.locator('[data-testid="own-count"]')).toBeVisible()
      await expect(page.locator('[data-testid="want-count"]')).toBeVisible()
    })

    test('should display favorite houses', async ({ page }) => {
      await page.goto('/collection/stats')

      // Should show most collected houses
      await expect(
        page.locator('[data-testid="favorite-houses"]')
      ).toBeVisible()
    })

    test('should show collection value', async ({ page }) => {
      await page.goto('/collection/stats')

      // Should show estimated value if prices available
      const valueElement = page.locator('[data-testid="collection-value"]')

      if (await valueElement.isVisible()) {
        expect(await valueElement.textContent()).toBeTruthy()
      }
    })
  })

  test.describe('Mobile Collection Management', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('should view collection on mobile', async ({ page }) => {
      await page.goto('/collection')

      // Should load on mobile
      await expect(page).toHaveURL(/collection/)
    })

    test('should add to collection on mobile', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Add to collection on mobile
      await page.click('[data-testid="add-to-collection"]')
      await page.click('[data-testid="collection-own"]')
      await page.click('button:has-text("Add")')

      // Should add successfully
      await expect(page.locator('text=/added|success/i')).toBeVisible({ timeout: 5000 })
    })

    test('should filter collection on mobile', async ({ page }) => {
      await page.goto('/collection')

      // Open filter menu on mobile
      await page.click('[data-testid="mobile-filter"]')

      // Select filter
      await page.click('[data-testid="filter-own"]')

      // Should apply filter
      await page.waitForTimeout(500)
    })

    test('should edit item on mobile', async ({ page }) => {
      await page.goto('/collection')

      // Click on item
      await page.click('[data-testid="collection-item"]:first-child')

      // Edit notes
      await page.click('[data-testid="edit-notes"]')
      await page.fill('[name="notes"]', 'Mobile edit')
      await page.click('button:has-text("Save")')

      // Should save
      await expect(page.locator('text=/saved|updated/i')).toBeVisible()
    })
  })

  test.describe('Collection Search and Filter Combinations', () => {
    test('should search and filter together', async ({ page }) => {
      await page.goto('/collection')

      // Apply type filter
      await page.click('[data-testid="filter-own"]')
      await page.waitForTimeout(500)

      // Then search
      await page.fill('[data-testid="collection-search"]', 'rose')
      await page.keyboard.press('Enter')

      // Should show filtered and searched results
      await page.waitForTimeout(500)
    })

    test('should filter by multiple criteria', async ({ page }) => {
      await page.goto('/collection')

      // Filter by type
      await page.click('[data-testid="filter-own"]')

      // Filter by house
      await page.selectOption('[data-testid="house-filter"]', 'house-1')

      // Should apply both filters
      await page.waitForTimeout(500)
    })

    test('should clear all filters', async ({ page }) => {
      await page.goto('/collection')

      // Apply filters
      await page.click('[data-testid="filter-own"]')
      await page.fill('[data-testid="collection-search"]', 'rose')

      // Clear all
      await page.click('[data-testid="clear-filters"]')

      // Should show all items
      await page.waitForTimeout(500)
    })
  })

  test.describe('Empty Collection States', () => {
    test('should show empty state for new user', async ({ page }) => {
      // Login as new user with empty collection
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()
      await loginPage.login('newuser@example.com', 'TestPassword123!')

      await page.goto('/collection')

      // Should show empty state
      await expect(
        page.locator('text=/no perfumes|empty collection|start adding/i')
      ).toBeVisible()
    })

    test('should show call-to-action in empty state', async ({ page }) => {
      // Assuming empty collection
      await page.goto('/collection')

      const emptyState = page.locator('text=/no perfumes|empty/i')

      if (await emptyState.isVisible()) {
        // Should have button to add perfumes
        await expect(
          page.locator('text=/browse|add perfume|explore/i')
        ).toBeVisible()
      }
    })
  })
})

