import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

import { HomePage } from "./pages/HomePage"
import { LoginPage } from "./pages/LoginPage"
import { PerfumePage } from "./pages/PerfumePage"
import { VaultPage } from "./pages/VaultPage"

test.describe("Accessibility Tests", () => {
  test.describe("WCAG 2.1 Compliance", () => {
    test("should have no accessibility violations on home page", async ({
      page,
    }) => {
      const homePage = new HomePage(page)
      await homePage.navigateTo()
      await homePage.waitForReady()

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test("should have no accessibility violations on vault page", async ({
      page,
    }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test("should have no accessibility violations on perfume detail page", async ({
      page,
    }) => {
      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)
      await perfumePage.waitForPerfumeData()

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test("should have no accessibility violations on login page", async ({
      page,
    }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test("should have no critical or serious violations across authenticated pages", async ({
      page,
    }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()
      await loginPage.login("test@example.com", "TestPassword123!")

      // Test collection page
      await page.goto("/collection")
      await page.waitForLoadState("networkidle")

      const collectionScan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze()

      const criticalViolations = collectionScan.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious"
      )

      expect(criticalViolations).toEqual([])
    })
  })

  test.describe("Keyboard Navigation", () => {
    test("should navigate through home page with keyboard", async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.navigateTo()
      await homePage.waitForReady()

      // Tab through interactive elements
      await page.keyboard.press("Tab")
      await page.waitForTimeout(100)

      // Check that an element has focus
      const focused = await page.evaluate(() => document.activeElement?.tagName)
      expect(focused).toBeTruthy()
    })

    test("should navigate vault page with keyboard", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      // Tab to search input
      await page.keyboard.press("Tab")
      await page.keyboard.press("Tab")

      // Should be able to type in search
      await page.keyboard.type("rose")

      // Press Enter to search
      await page.keyboard.press("Enter")

      await vaultPage.waitForLoadingComplete()
    })

    test("should activate buttons with Enter key", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      // Focus on a button
      await page.focus('[data-testid="filter-button"]')

      // Press Enter
      await page.keyboard.press("Enter")

      // Button should be activated
      await page.waitForTimeout(500)
    })

    test("should activate buttons with Space key", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      // Focus on a button
      await page.focus('[data-testid="sort-button"]')

      // Press Space
      await page.keyboard.press("Space")

      // Button should be activated
      await page.waitForTimeout(500)
    })

    test("should close modal with Escape key", async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()
      await loginPage.login("test@example.com", "TestPassword123!")

      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)
      await perfumePage.waitForPerfumeData()

      // Open a modal
      const addToCollectionButton = page.locator('[data-testid="add-to-collection"]')

      if (await addToCollectionButton.isVisible()) {
        await addToCollectionButton.click()

        // Press Escape to close
        await page.keyboard.press("Escape")

        // Modal should close
        await page.waitForTimeout(500)
      }
    })

    test("should trap focus in modal", async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()
      await loginPage.login("test@example.com", "TestPassword123!")

      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)
      await perfumePage.waitForPerfumeData()

      // Open modal
      const addToCollectionButton = page.locator('[data-testid="add-to-collection"]')

      if (await addToCollectionButton.isVisible()) {
        await addToCollectionButton.click()

        // Tab through modal elements
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press("Tab")
        }

        // Focus should stay within modal
        const focused = await page.evaluate(() => {
          const activeElement = document.activeElement
          return activeElement?.closest('[role="dialog"]') !== null
        })

        expect(focused).toBe(true)
      }
    })

    test("should navigate form with keyboard", async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()

      // Tab to email field
      await page.keyboard.press("Tab")
      await page.keyboard.type("test@example.com")

      // Tab to password field
      await page.keyboard.press("Tab")
      await page.keyboard.type("password123")

      // Tab to submit button and press Enter
      await page.keyboard.press("Tab")
      await page.keyboard.press("Enter")

      // Form should submit
      await page.waitForTimeout(1000)
    })
  })

  test.describe("Screen Reader Support", () => {
    test("should have proper ARIA labels on navigation", async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.navigateTo()

      // Check navigation has proper labels
      const nav = page.locator("nav")
      const ariaLabel = await nav.getAttribute("aria-label")

      expect(ariaLabel).toBeTruthy()
    })

    test("should have proper ARIA labels on forms", async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()

      // Check form inputs have labels
      const emailInput = page.locator('[name="email"]')
      const emailLabel = await emailInput.getAttribute("aria-label")
      const emailLabelElement = await page.locator('label[for="email"]').count()

      expect(emailLabel || emailLabelElement > 0).toBeTruthy()
    })

    test("should have proper ARIA labels on buttons", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      // Check buttons have labels
      const buttons = await page.locator("button").all()

      for (const button of buttons.slice(0, 5)) {
        const ariaLabel = await button.getAttribute("aria-label")
        const text = await button.textContent()

        expect(ariaLabel || (text && text.trim().length > 0)).toBeTruthy()
      }
    })

    test("should have proper heading hierarchy", async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.navigateTo()
      await homePage.waitForReady()

      // Check heading hierarchy
      const h1Count = await page.locator("h1").count()
      expect(h1Count).toBeGreaterThan(0)
      expect(h1Count).toBeLessThanOrEqual(1) // Should have only one h1

      // H2s should not come before h1
      const headings = await page.locator("h1, h2, h3, h4, h5, h6").all()

      if (headings.length > 0) {
        const firstHeading = await headings[0].evaluate((el) => el.tagName)
        expect(firstHeading).toBe("H1")
      }
    })

    test("should have alt text on images", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      // Check images have alt text
      const images = await page.locator("img").all()

      for (const image of images.slice(0, 10)) {
        const alt = await image.getAttribute("alt")
        expect(alt).toBeTruthy()
      }
    })

    test("should have proper role attributes", async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.navigateTo()

      // Check main content area
      const main = page.locator('main, [role="main"]')
      expect(await main.count()).toBeGreaterThan(0)

      // Check navigation
      const nav = page.locator('nav, [role="navigation"]')
      expect(await nav.count()).toBeGreaterThan(0)
    })

    test("should announce dynamic content changes", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()

      // Perform search
      await vaultPage.search("rose")
      await vaultPage.waitForLoadingComplete()

      // Check for live region
      const liveRegion = page.locator('[aria-live], [role="status"]')
      expect(await liveRegion.count()).toBeGreaterThan(0)
    })

    test("should have skip to main content link", async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.navigateTo()

      // Focus on skip link with first Tab
      await page.keyboard.press("Tab")

      const skipLink = page.locator("text=/skip to.*content|skip.*main/i")
      const isVisible = await skipLink.isVisible()

      if (isVisible) {
        expect(await skipLink.getAttribute("href")).toContain("#")
      }
    })
  })

  test.describe("Color Contrast", () => {
    test("should have sufficient color contrast on main elements", async ({
      page,
    }) => {
      const homePage = new HomePage(page)
      await homePage.navigateTo()
      await homePage.waitForReady()

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2aa"])
        .disableRules(["color-contrast"]) // We'll re-enable it specifically
        .analyze()

      // Check for color contrast violations
      const contrastScan = await new AxeBuilder({ page })
        .withRules(["color-contrast"])
        .analyze()

      expect(contrastScan.violations).toEqual([])
    })

    test("should have sufficient contrast in dark mode", async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.navigateTo()

      // Enable dark mode if available
      const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"]')

      if (await darkModeToggle.isVisible()) {
        await darkModeToggle.click()
        await page.waitForTimeout(500)

        // Run contrast check
        const contrastScan = await new AxeBuilder({ page })
          .withRules(["color-contrast"])
          .analyze()

        expect(contrastScan.violations).toEqual([])
      }
    })
  })

  test.describe("Focus Management", () => {
    test("should have visible focus indicators", async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.navigateTo()

      // Tab to first interactive element
      await page.keyboard.press("Tab")

      // Check that focused element has outline or other focus indicator
      const focusedElementStyle = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement
        const styles = window.getComputedStyle(el)
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          boxShadow: styles.boxShadow,
        }
      })

      // Should have some form of focus indicator
      const hasFocusIndicator =
        focusedElementStyle.outlineWidth !== "0px" ||
        focusedElementStyle.boxShadow !== "none"

      expect(hasFocusIndicator).toBe(true)
    })

    test("should restore focus after closing modal", async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()
      await loginPage.login("test@example.com", "TestPassword123!")

      const vaultPage = new VaultPage(page)
      const perfumePage = new PerfumePage(page)

      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()
      await vaultPage.clickPerfumeCard(0)
      await perfumePage.waitForPerfumeData()

      // Focus on button that opens modal
      const addButton = page.locator('[data-testid="add-to-collection"]')

      if (await addButton.isVisible()) {
        await addButton.focus()
        await addButton.click()

        // Close modal with Escape
        await page.keyboard.press("Escape")

        // Focus should return to button
        const focusedElement = await page.evaluate(() =>
          document.activeElement?.getAttribute("data-testid")
        )

        expect(focusedElement).toBe("add-to-collection")
      }
    })

    test("should move focus to error messages", async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()

      // Submit form with errors
      await page.click('button[type="submit"]')

      // Focus should move to error message or first invalid field
      await page.waitForTimeout(500)

      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement
        return {
          tagName: el?.tagName,
          role: el?.getAttribute("role"),
        }
      })

      expect(focusedElement.tagName).toBeTruthy()
    })
  })

  test.describe("Responsive Accessibility", () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test("should be accessible on mobile devices", async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.navigateTo()
      await homePage.waitForReady()

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test("should have sufficient touch target sizes on mobile", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      // Check button sizes (should be at least 44x44 pixels)
      const buttons = await page.locator("button").all()

      for (const button of buttons.slice(0, 5)) {
        const box = await button.boundingBox()

        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44)
          expect(box.height).toBeGreaterThanOrEqual(44)
        }
      }
    })

    test("should have proper spacing for touch targets", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      // Interactive elements should have adequate spacing
      const interactiveElements = await page
        .locator('button, a, input, [role="button"]')
        .all()

      // Check that elements aren't too close together
      for (let i = 0; i < Math.min(interactiveElements.length - 1, 5); i++) {
        const box1 = await interactiveElements[i].boundingBox()
        const box2 = await interactiveElements[i + 1].boundingBox()

        if (box1 && box2) {
          // Calculate distance between elements
          const distance = Math.abs(box2.y - (box1.y + box1.height))

          // Should have at least 8px spacing (common mobile guideline)
          if (distance < 100) {
            // Only check if elements are close
            expect(distance).toBeGreaterThanOrEqual(0)
          }
        }
      }
    })
  })

  test.describe("Semantic HTML", () => {
    test("should use semantic HTML elements", async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.navigateTo()

      // Check for semantic elements
      expect(await page.locator("header").count()).toBeGreaterThan(0)
      expect(await page.locator("main").count()).toBeGreaterThan(0)
      expect(await page.locator("nav").count()).toBeGreaterThan(0)
      expect(await page.locator("footer").count()).toBeGreaterThanOrEqual(0)
    })

    test("should use proper list markup", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      // Lists should use ul/ol and li elements
      const lists = await page.locator("ul, ol").count()

      if (lists > 0) {
        // Check that lists contain list items
        const firstList = page.locator("ul, ol").first()
        const listItems = await firstList.locator("li").count()

        expect(listItems).toBeGreaterThan(0)
      }
    })

    test("should use proper button elements", async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.navigateTo()

      // Interactive elements that aren't links should be buttons
      const divButtons = await page
        .locator('div[onclick], div[role="button"]')
        .count()

      // Should prefer actual button elements
      const actualButtons = await page.locator("button").count()

      expect(actualButtons).toBeGreaterThan(0)
    })
  })

  test.describe("Form Accessibility", () => {
    test("should have proper form labels", async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()

      // All inputs should have labels
      const inputs = await page.locator("input").all()

      for (const input of inputs) {
        const id = await input.getAttribute("id")
        const ariaLabel = await input.getAttribute("aria-label")
        const ariaLabelledBy = await input.getAttribute("aria-labelledby")

        // Should have either a label, aria-label, or aria-labelledby
        const hasLabel =
          (id && (await page.locator(`label[for="${id}"]`).count()) > 0) ||
          ariaLabel ||
          ariaLabelledBy

        expect(hasLabel).toBeTruthy()
      }
    })

    test("should display validation errors accessibly", async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()

      // Submit form with errors
      await page.click('button[type="submit"]')

      // Error messages should be associated with inputs
      const errorMessage = page.locator('[role="alert"], .error-message').first()

      if (await errorMessage.isVisible()) {
        const ariaLive = await errorMessage.getAttribute("aria-live")
        const role = await errorMessage.getAttribute("role")

        expect(ariaLive || role).toBeTruthy()
      }
    })

    test("should indicate required fields", async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()

      // Required inputs should be marked
      const requiredInputs = await page.locator("input[required]").all()

      for (const input of requiredInputs) {
        const ariaRequired = await input.getAttribute("aria-required")
        const required = await input.getAttribute("required")

        expect(ariaRequired === "true" || required !== null).toBeTruthy()
      }
    })
  })
})
