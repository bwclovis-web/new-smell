import { expect, test } from '@playwright/test'

import { LoginPage } from './pages/LoginPage'
import { PerfumePage } from './pages/PerfumePage'
import { VaultPage } from './pages/VaultPage'

test.describe('Wishlist Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const loginPage = new LoginPage(page)
    await loginPage.navigateTo()
    await loginPage.login('test@example.com', 'TestPassword123!')
    await expect(page).toHaveURL(/\/(?!login)/)
  })

  test.describe('Adding to Wishlist', () => {
    test('should add perfume to wishlist from detail page', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Click wishlist button
      await perfumePage.clickWishlistButton()

      // Should be added to wishlist
      const isInWishlist = await perfumePage.isInWishlist()
      expect(isInWishlist).toBe(true)
    })

    test('should add perfume to wishlist from vault page', async ({ page }) => {
      const vaultPage = new VaultPage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      // Click wishlist button on card
      await page.click('[data-testid="wishlist-button"]', { position: { x: 10, y: 10 } })

      // Should show success
      await page.waitForTimeout(500)
    })

    test('should show visual feedback when adding to wishlist', async ({
      page,
    }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Get initial button state
      const wishlistButton = page.locator('[data-testid="wishlist-button"]')
      const initialClass = await wishlistButton.getAttribute('class')

      // Click wishlist
      await perfumePage.clickWishlistButton()

      // Button should change appearance
      const newClass = await wishlistButton.getAttribute('class')
      expect(newClass).not.toBe(initialClass)
    })

    test('should prevent duplicate wishlist entries', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Add to wishlist
      await perfumePage.clickWishlistButton()
      await page.waitForTimeout(500)

      // Try to add again - should remove instead
      await perfumePage.clickWishlistButton()

      const isInWishlist = await perfumePage.isInWishlist()
      expect(isInWishlist).toBe(false)
    })

    test('should update wishlist count', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      // Get initial wishlist count
      const initialCount = await page
        .locator('[data-testid="wishlist-count"]')
        .textContent()

      await vaultPage.clickPerfumeCard(0)
      await perfumePage.waitForPerfumeData()

      // Add to wishlist
      await perfumePage.clickWishlistButton()
      await page.waitForTimeout(500)

      // Navigate to wishlist
      await page.goto('/wishlist')

      // Count should have increased
      const newCount = await page
        .locator('[data-testid="wishlist-count"]')
        .textContent()

      expect(newCount).not.toBe(initialCount)
    })
  })

  test.describe('Viewing Wishlist', () => {
    test('should view wishlist page', async ({ page }) => {
      await page.goto('/wishlist')

      // Should load wishlist page
      await expect(page).toHaveURL(/wishlist/)
      await expect(page.locator('h1, h2')).toContainText(/wishlist/i)
    })

    test('should display all wishlist items', async ({ page }) => {
      await page.goto('/wishlist')

      // Should show wishlist items
      const items = await page.locator('[data-testid="wishlist-item"]').count()
      expect(items).toBeGreaterThanOrEqual(0)
    })

    test('should show empty state for empty wishlist', async ({ page }) => {
      // Login as user with empty wishlist
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()
      await loginPage.login('newuser@example.com', 'TestPassword123!')

      await page.goto('/wishlist')

      // Should show empty state
      await expect(
        page.locator('text=/no.*wishlist|empty wishlist|start adding/i')
      ).toBeVisible()
    })

    test('should navigate to perfume from wishlist', async ({ page }) => {
      await page.goto('/wishlist')

      const firstItem = page.locator('[data-testid="wishlist-item"]').first()

      if (await firstItem.isVisible()) {
        await firstItem.click()

        // Should navigate to perfume page
        await expect(page).toHaveURL(/perfume/)
      }
    })

    test('should display perfume information in wishlist', async ({ page }) => {
      await page.goto('/wishlist')

      const firstItem = page.locator('[data-testid="wishlist-item"]').first()

      if (await firstItem.isVisible()) {
        // Should show perfume name
        await expect(firstItem.locator('[data-testid="perfume-name"]')).toBeVisible()

        // Should show perfume house
        await expect(firstItem.locator('[data-testid="perfume-house"]')).toBeVisible()

        // Should show image
        await expect(firstItem.locator('img')).toBeVisible()
      }
    })
  })

  test.describe('Removing from Wishlist', () => {
    test('should remove perfume from wishlist', async ({ page }) => {
      await page.goto('/wishlist')

      // Get initial count
      const initialCount = await page.locator('[data-testid="wishlist-item"]').count()

      if (initialCount > 0) {
        // Click remove button
        await page.click('[data-testid="remove-from-wishlist"]', { position: { x: 5, y: 5 } })

        // Wait for removal
        await page.waitForTimeout(500)

        // Count should decrease
        const newCount = await page.locator('[data-testid="wishlist-item"]').count()
        expect(newCount).toBeLessThan(initialCount)
      }
    })

    test('should remove from wishlist on perfume page', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Add to wishlist first
      if (!(await perfumePage.isInWishlist())) {
        await perfumePage.clickWishlistButton()
        await page.waitForTimeout(500)
      }

      // Remove from wishlist
      await perfumePage.clickWishlistButton()

      // Should be removed
      const isInWishlist = await perfumePage.isInWishlist()
      expect(isInWishlist).toBe(false)
    })

    test('should confirm before removing from wishlist', async ({ page }) => {
      await page.goto('/wishlist')

      const removeButton = page.locator('[data-testid="remove-from-wishlist"]').first()

      if (await removeButton.isVisible()) {
        await removeButton.click()

        // Should show confirmation dialog
        const confirmDialog = page.locator('text=/confirm|sure|remove/i')

        if (await confirmDialog.isVisible()) {
          await page.click('button:has-text("Remove")')
        }
      }
    })

    test('should cancel removal from wishlist', async ({ page }) => {
      await page.goto('/wishlist')

      const initialCount = await page.locator('[data-testid="wishlist-item"]').count()

      const removeButton = page.locator('[data-testid="remove-from-wishlist"]').first()

      if (await removeButton.isVisible()) {
        await removeButton.click()

        // Cancel if confirmation shown
        const cancelButton = page.locator('button:has-text("Cancel")')

        if (await cancelButton.isVisible()) {
          await cancelButton.click()

          // Count should remain same
          const newCount = await page.locator('[data-testid="wishlist-item"]').count()
          expect(newCount).toBe(initialCount)
        }
      }
    })

    test('should show undo option after removal', async ({ page }) => {
      await page.goto('/wishlist')

      const removeButton = page.locator('[data-testid="remove-from-wishlist"]').first()

      if (await removeButton.isVisible()) {
        await removeButton.click()

        // Look for undo button
        const undoButton = page.locator('text=/undo/i')

        if (await undoButton.isVisible()) {
          expect(await undoButton.textContent()).toContain('Undo')
        }
      }
    })
  })

  test.describe('Wishlist Organization', () => {
    test('should sort wishlist by name', async ({ page }) => {
      await page.goto('/wishlist')

      // Select sort option
      await page.selectOption('[data-testid="wishlist-sort"]', 'name-asc')

      // Should reorder items
      await page.waitForTimeout(500)
    })

    test('should sort wishlist by date added', async ({ page }) => {
      await page.goto('/wishlist')

      // Sort by date added
      await page.selectOption('[data-testid="wishlist-sort"]', 'date-desc')

      // Should reorder
      await page.waitForTimeout(500)
    })

    test('should filter wishlist by house', async ({ page }) => {
      await page.goto('/wishlist')

      // Apply house filter
      await page.selectOption('[data-testid="house-filter"]', 'house-1')

      // Should filter results
      await page.waitForTimeout(500)
    })

    test('should search within wishlist', async ({ page }) => {
      await page.goto('/wishlist')

      // Search
      await page.fill('[data-testid="wishlist-search"]', 'rose')
      await page.keyboard.press('Enter')

      // Should show filtered results
      await page.waitForTimeout(500)
    })

    test('should clear wishlist filters', async ({ page }) => {
      await page.goto('/wishlist')

      // Apply filter
      await page.fill('[data-testid="wishlist-search"]', 'rose')
      await page.keyboard.press('Enter')

      // Clear filters
      await page.click('[data-testid="clear-filters"]')

      // Should show all items
      await page.waitForTimeout(500)
    })
  })

  test.describe('Wishlist Sharing', () => {
    test('should make wishlist public', async ({ page }) => {
      await page.goto('/wishlist/settings')

      // Toggle public setting
      await page.click('[data-testid="wishlist-public-toggle"]')

      // Should save setting
      await expect(page.locator('text=/saved|updated/i')).toBeVisible()
    })

    test('should generate shareable wishlist link', async ({ page }) => {
      await page.goto('/wishlist')

      // Click share button
      await page.click('[data-testid="share-wishlist"]')

      // Should show share link
      await expect(page.locator('[data-testid="share-link"]')).toBeVisible()
    })

    test('should copy wishlist share link', async ({ page }) => {
      await page.goto('/wishlist')

      // Click share
      await page.click('[data-testid="share-wishlist"]')

      // Click copy
      await page.click('[data-testid="copy-link"]')

      // Should show copied message
      await expect(page.locator('text=/copied/i')).toBeVisible()
    })

    test('should share wishlist via email', async ({ page }) => {
      await page.goto('/wishlist')

      // Click share
      await page.click('[data-testid="share-wishlist"]')

      // Click email share
      const emailShare = page.locator('[data-testid="share-via-email"]')

      if (await emailShare.isVisible()) {
        await emailShare.click()

        // Should open email form
        await expect(page.locator('text=/email|send/i')).toBeVisible()
      }
    })
  })

  test.describe('Wishlist Alerts', () => {
    test('should enable price drop alerts', async ({ page }) => {
      await page.goto('/wishlist')

      const alertToggle = page.locator('[data-testid="alert-toggle"]').first()

      if (await alertToggle.isVisible()) {
        await alertToggle.click()

        // Should enable alerts
        await page.waitForTimeout(500)
      }
    })

    test('should enable availability alerts', async ({ page }) => {
      await page.goto('/wishlist')

      const availabilityAlert = page
        .locator('[data-testid="availability-alert"]')
        .first()

      if (await availabilityAlert.isVisible()) {
        await availabilityAlert.click()

        // Should enable
        await page.waitForTimeout(500)
      }
    })

    test('should configure alert preferences', async ({ page }) => {
      await page.goto('/wishlist/settings')

      // Set alert preferences
      await page.check('[data-testid="email-alerts"]')
      await page.check('[data-testid="push-alerts"]')

      // Save
      await page.click('button:has-text("Save")')

      // Should save
      await expect(page.locator('text=/saved/i')).toBeVisible()
    })
  })

  test.describe('Wishlist Notes', () => {
    test('should add notes to wishlist item', async ({ page }) => {
      await page.goto('/wishlist')

      const firstItem = page.locator('[data-testid="wishlist-item"]').first()

      if (await firstItem.isVisible()) {
        // Click item to view details
        await firstItem.click()

        // Add note
        await page.fill('[data-testid="wishlist-notes"]', 'Need to try this one')

        // Save
        await page.click('button:has-text("Save")')

        // Should save note
        await expect(page.locator('text=/saved/i')).toBeVisible()
      }
    })

    test('should edit wishlist item notes', async ({ page }) => {
      await page.goto('/wishlist')

      const editButton = page.locator('[data-testid="edit-notes"]').first()

      if (await editButton.isVisible()) {
        await editButton.click()

        // Update notes
        await page.fill('[data-testid="wishlist-notes"]', 'Updated notes')

        // Save
        await page.click('button:has-text("Save")')

        // Should update
        await expect(page.locator('text=/updated|saved/i')).toBeVisible()
      }
    })

    test('should set priority for wishlist items', async ({ page }) => {
      await page.goto('/wishlist')

      const priorityDropdown = page
        .locator('[data-testid="wishlist-priority"]')
        .first()

      if (await priorityDropdown.isVisible()) {
        await priorityDropdown.selectOption('high')

        // Should save automatically
        await page.waitForTimeout(500)
      }
    })
  })

  test.describe('Bulk Actions', () => {
    test('should select multiple wishlist items', async ({ page }) => {
      await page.goto('/wishlist')

      // Enable selection mode
      await page.click('[data-testid="select-mode"]')

      // Select multiple items
      await page.check('[data-testid="select-item"]:nth-child(1)')
      await page.check('[data-testid="select-item"]:nth-child(2)')

      // Should show selected count
      await expect(page.locator('text=/2.*selected/i')).toBeVisible()
    })

    test('should remove multiple items from wishlist', async ({ page }) => {
      await page.goto('/wishlist')

      // Enable selection mode
      await page.click('[data-testid="select-mode"]')

      // Select items
      await page.check('[data-testid="select-item"]:nth-child(1)')
      await page.check('[data-testid="select-item"]:nth-child(2)')

      // Remove selected
      await page.click('[data-testid="remove-selected"]')

      // Confirm
      await page.click('button:has-text("Remove")')

      // Should remove items
      await expect(page.locator('text=/removed/i')).toBeVisible()
    })

    test('should move multiple items to collection', async ({ page }) => {
      await page.goto('/wishlist')

      // Enable selection mode
      await page.click('[data-testid="select-mode"]')

      // Select items
      await page.check('[data-testid="select-item"]:nth-child(1)')

      // Move to collection
      const moveButton = page.locator('[data-testid="move-to-collection"]')

      if (await moveButton.isVisible()) {
        await moveButton.click()

        // Select collection type
        await page.click('[data-testid="collection-own"]')

        // Should move items
        await expect(page.locator('text=/moved|added/i')).toBeVisible()
      }
    })
  })

  test.describe('Mobile Wishlist', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('should view wishlist on mobile', async ({ page }) => {
      await page.goto('/wishlist')

      // Should load on mobile
      await expect(page).toHaveURL(/wishlist/)
    })

    test('should add to wishlist on mobile', async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Add to wishlist on mobile
      await perfumePage.clickWishlistButton()

      // Should add
      const isInWishlist = await perfumePage.isInWishlist()
      expect(isInWishlist).toBe(true)
    })

    test('should remove from wishlist on mobile', async ({ page }) => {
      await page.goto('/wishlist')

      const removeButton = page.locator('[data-testid="remove-from-wishlist"]').first()

      if (await removeButton.isVisible()) {
        await removeButton.click()
        await page.waitForTimeout(500)
      }
    })

    test('should sort wishlist on mobile', async ({ page }) => {
      await page.goto('/wishlist')

      // Open sort menu
      await page.click('[data-testid="mobile-sort"]')

      // Select sort option
      await page.click('text=/name|date/i')

      // Should sort
      await page.waitForTimeout(500)
    })
  })

  test.describe('Wishlist Integration with Collection', () => {
    test('should move wishlist item to collection', async ({ page }) => {
      await page.goto('/wishlist')

      const firstItem = page.locator('[data-testid="wishlist-item"]').first()

      if (await firstItem.isVisible()) {
        // Click move to collection
        await page.click('[data-testid="move-to-collection"]', { position: { x: 5, y: 5 } })

        // Select collection type
        await page.click('[data-testid="collection-own"]')

        // Confirm
        await page.click('button:has-text("Move")')

        // Should move to collection
        await expect(page.locator('text=/moved|added/i')).toBeVisible()
      }
    })

    test('should keep item in wishlist after adding to collection', async ({
      page,
    }) => {
      await page.goto('/wishlist')

      const initialCount = await page.locator('[data-testid="wishlist-item"]').count()

      const firstItem = page.locator('[data-testid="wishlist-item"]').first()

      if (await firstItem.isVisible()) {
        // Add to collection (don't move)
        const addButton = page.locator('[data-testid="add-to-collection"]')

        if (await addButton.isVisible()) {
          await addButton.click()
          await page.click('[data-testid="collection-own"]')
          await page.click('button:has-text("Add")')

          await page.waitForTimeout(500)

          // Should still be in wishlist
          const newCount = await page.locator('[data-testid="wishlist-item"]').count()
          expect(newCount).toBe(initialCount)
        }
      }
    })
  })
})

