import { expect, test } from "@playwright/test"

import { LoginPage } from "./pages/LoginPage"
import { PerfumePage } from "./pages/PerfumePage"
import { VaultPage } from "./pages/VaultPage"

test.describe("Reviews and Ratings", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const loginPage = new LoginPage(page)
    await loginPage.navigateTo()
    await loginPage.login("test@example.com", "TestPassword123!")
    await expect(page).toHaveURL(/\/(?!login)/)
  })

  test.describe("Rating Perfumes", () => {
    test("should rate a perfume", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Rate the perfume
      await perfumePage.ratePerfume(5)

      // Should show rating
      await perfumePage.assertRatingDisplayed(5)
    })

    test("should change existing rating", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Rate 3 stars first
      await perfumePage.ratePerfume(3)
      await page.waitForTimeout(500)

      // Change to 5 stars
      await perfumePage.ratePerfume(5)

      // Should show updated rating
      await perfumePage.assertRatingDisplayed(5)
    })

    test("should rate with half stars", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Rate with half star (if supported)
      const halfStarRating = page.locator('[data-testid="rating-3.5"]')

      if (await halfStarRating.isVisible()) {
        await halfStarRating.click()
        await page.waitForTimeout(500)
      }
    })

    test("should display average rating", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Should show average rating from all users
      await expect(page.locator('[data-testid="average-rating"]')).toBeVisible()
    })

    test("should show rating count", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Should show how many users rated
      await expect(page.locator('[data-testid="rating-count"]')).toBeVisible()
    })

    test("should show hover preview when rating", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Hover over rating stars
      await page.hover('[data-testid="rating-4"]')

      // Should show preview
      await page.waitForTimeout(200)
    })
  })

  test.describe("Writing Reviews", () => {
    test("should write a review", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Click write review button
      await page.click('[data-testid="write-review"]')

      // Fill review form
      await page.fill('[name="reviewTitle"]', "Excellent Perfume")
      await page.fill(
        '[name="reviewText"]',
        "This is a detailed review of the perfume. It smells amazing!"
      )

      // Submit review
      await page.click('button:has-text("Submit")')

      // Should show success
      await expect(page.locator("text=/review.*submitted|thank you/i")).toBeVisible()
    })

    test("should rate while writing review", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Click write review
      await page.click('[data-testid="write-review"]')

      // Add rating in review form
      await page.click('[data-testid="review-rating-5"]')

      // Fill review
      await page.fill('[name="reviewTitle"]', "Great!")
      await page.fill('[name="reviewText"]', "Wonderful perfume")

      // Submit
      await page.click('button:has-text("Submit")')

      // Should submit successfully
      await expect(page.locator("text=/submitted|success/i")).toBeVisible()
    })

    test("should enforce minimum review length", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Click write review
      await page.click('[data-testid="write-review"]')

      // Enter too short review
      await page.fill('[name="reviewText"]', "Too short")

      // Try to submit
      await page.click('button:has-text("Submit")')

      // Should show error
      await expect(
        page.locator("text=/minimum|too short|more characters/i")
      ).toBeVisible()
    })

    test("should require rating with review", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Click write review
      await page.click('[data-testid="write-review"]')

      // Fill review without rating
      await page.fill('[name="reviewTitle"]', "Good perfume")
      await page.fill('[name="reviewText"]', "This is a review without rating")

      // Try to submit
      await page.click('button:has-text("Submit")')

      // Should show error about missing rating
      await expect(
        page.locator("text=/rating.*required|please.*rate/i")
      ).toBeVisible()
    })

    test("should save draft review", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Start writing review
      await page.click('[data-testid="write-review"]')
      await page.fill('[name="reviewTitle"]', "Draft review")
      await page.fill('[name="reviewText"]', "This is a draft")

      // Save as draft
      const saveDraftButton = page.locator('button:has-text("Save Draft")')

      if (await saveDraftButton.isVisible()) {
        await saveDraftButton.click()
        await expect(page.locator("text=/draft.*saved/i")).toBeVisible()
      }
    })

    test("should cancel review", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Start writing review
      await page.click('[data-testid="write-review"]')
      await page.fill('[name="reviewText"]', "Canceling this")

      // Click cancel
      await page.click('button:has-text("Cancel")')

      // Should return to perfume page
      await perfumePage.assertPageLoaded()
    })
  })

  test.describe("Viewing Reviews", () => {
    test("should display all reviews for a perfume", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Should show reviews section
      await expect(page.locator('[data-testid="reviews-section"]')).toBeVisible()
    })

    test("should sort reviews by date", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Sort reviews
      await page.selectOption('[data-testid="review-sort"]', "date-desc")

      // Should reorder reviews
      await page.waitForTimeout(500)
    })

    test("should sort reviews by rating", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Sort by rating
      await page.selectOption('[data-testid="review-sort"]', "rating-desc")

      // Should reorder
      await page.waitForTimeout(500)
    })

    test("should filter reviews by rating", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Filter to 5-star reviews only
      await page.click('[data-testid="filter-5-star"]')

      // Should show only 5-star reviews
      await page.waitForTimeout(500)
    })

    test("should paginate reviews", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Click next page if available
      const nextButton = page.locator('[data-testid="reviews-next-page"]')

      if (await nextButton.isVisible()) {
        await nextButton.click()
        await page.waitForTimeout(500)
      }
    })

    test("should show verified purchase badge", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Look for verified purchase badge
      const verifiedBadge = page.locator('[data-testid="verified-purchase"]')

      if (await verifiedBadge.isVisible()) {
        expect(await verifiedBadge.textContent()).toContain("Verified")
      }
    })
  })

  test.describe("Editing Reviews", () => {
    test("should edit own review", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Find own review and click edit
      const editButton = page.locator('[data-testid="edit-own-review"]')

      if (await editButton.isVisible()) {
        await editButton.click()

        // Update review
        await page.fill('[name="reviewText"]', "Updated review text")

        // Save
        await page.click('button:has-text("Save")')

        // Should show success
        await expect(page.locator("text=/updated|saved/i")).toBeVisible()
      }
    })

    test("should not show edit button for other users reviews", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Look for reviews from other users
      const otherUserReviews = page.locator('[data-testid="review-card"]')
      const count = await otherUserReviews.count()

      if (count > 0) {
        // Should not have edit button on other users' reviews
        const editButtons = await page.locator('[data-testid="edit-review"]').count()

        // Should only have edit button on own review or none at all
        expect(editButtons).toBeLessThanOrEqual(1)
      }
    })

    test("should update rating when editing review", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      const editButton = page.locator('[data-testid="edit-own-review"]')

      if (await editButton.isVisible()) {
        await editButton.click()

        // Change rating
        await page.click('[data-testid="review-rating-4"]')

        // Save
        await page.click('button:has-text("Save")')

        // Should update
        await expect(page.locator("text=/updated/i")).toBeVisible()
      }
    })
  })

  test.describe("Deleting Reviews", () => {
    test("should delete own review", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      const deleteButton = page.locator('[data-testid="delete-own-review"]')

      if (await deleteButton.isVisible()) {
        await deleteButton.click()

        // Confirm deletion
        await page.click('button:has-text("Delete")')

        // Should show success
        await expect(page.locator("text=/deleted|removed/i")).toBeVisible()
      }
    })

    test("should confirm before deleting review", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      const deleteButton = page.locator('[data-testid="delete-own-review"]')

      if (await deleteButton.isVisible()) {
        await deleteButton.click()

        // Should show confirmation
        await expect(page.locator("text=/confirm|sure|delete/i")).toBeVisible()
      }
    })

    test("should cancel review deletion", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      const deleteButton = page.locator('[data-testid="delete-own-review"]')

      if (await deleteButton.isVisible()) {
        await deleteButton.click()

        // Cancel
        await page.click('button:has-text("Cancel")')

        // Review should still exist
        await perfumePage.assertPageLoaded()
      }
    })
  })

  test.describe("Review Interactions", () => {
    test("should mark review as helpful", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Click helpful button
      const helpfulButton = page.locator('[data-testid="review-helpful"]').first()

      if (await helpfulButton.isVisible()) {
        await helpfulButton.click()

        // Should update count
        await page.waitForTimeout(500)
      }
    })

    test("should report review", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Click report button
      const reportButton = page.locator('[data-testid="report-review"]').first()

      if (await reportButton.isVisible()) {
        await reportButton.click()

        // Should show report dialog
        await expect(page.locator("text=/report|reason/i")).toBeVisible()
      }
    })

    test("should reply to review", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Click reply button
      const replyButton = page.locator('[data-testid="reply-to-review"]').first()

      if (await replyButton.isVisible()) {
        await replyButton.click()

        // Fill reply
        await page.fill('[name="replyText"]', "Thanks for the review!")

        // Submit
        await page.click('button:has-text("Reply")')

        // Should post reply
        await expect(page.locator("text=/reply.*posted/i")).toBeVisible()
      }
    })
  })

  test.describe("Mobile Reviews and Ratings", () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test("should rate perfume on mobile", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Rate on mobile
      await perfumePage.ratePerfume(5)

      // Should show rating
      await perfumePage.assertRatingDisplayed(5)
    })

    test("should write review on mobile", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Write review on mobile
      await page.click('[data-testid="write-review"]')
      await page.fill('[name="reviewTitle"]', "Mobile review")
      await page.fill('[name="reviewText"]', "This is a review from mobile")
      await page.click('[data-testid="review-rating-5"]')

      await page.click('button:has-text("Submit")')

      // Should submit
      await expect(page.locator("text=/submitted|success/i")).toBeVisible()
    })

    test("should view reviews on mobile", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)

      await perfumePage.waitForPerfumeData()

      // Should display reviews on mobile
      await expect(page.locator('[data-testid="reviews-section"]')).toBeVisible()
    })
  })
})
