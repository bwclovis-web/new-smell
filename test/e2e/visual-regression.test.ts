import { expect, test } from "@playwright/test"

import { HomePage } from "./pages/HomePage"
import { LoginPage } from "./pages/LoginPage"
import { PerfumePage } from "./pages/PerfumePage"
import { SignUpPage } from "./pages/SignUpPage"
import { VaultPage } from "./pages/VaultPage"

/**
 * Visual Regression Test Suite
 *
 * This suite captures screenshots of critical UI elements and pages
 * to detect unintended visual changes. Screenshots are compared against
 * baseline images stored in test-results/screenshots.
 *
 * Test coverage:
 * - Page layouts (home, vault, perfume detail, auth pages)
 * - Component states (hover, focus, error, loading)
 * - Responsive layouts (desktop, tablet, mobile)
 * - Dark/light modes (if applicable)
 * - Interactive elements (modals, dropdowns, tooltips)
 */

test.describe("Visual Regression Tests", () => {
  test.describe("Page Layouts", () => {
    test("should match homepage layout", async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.navigateTo()
      await homePage.waitForReady()

      // Wait for any animations to complete
      await page.waitForTimeout(500)

      // Take full page screenshot
      await expect(page).toHaveScreenshot("homepage-full.png", {
        fullPage: true,
        animations: "disabled",
      })
    })

    test("should match homepage hero section", async ({ page }) => {
      const homePage = new HomePage(page)
      await homePage.navigateTo()
      await homePage.waitForReady()

      // Screenshot just the hero section
      const hero = page.locator('[data-testid="hero-section"]').first()
      if ((await hero.count()) > 0) {
        await expect(hero).toHaveScreenshot("homepage-hero.png", {
          animations: "disabled",
        })
      }
    })

    test("should match vault page layout", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForReady()

      await expect(page).toHaveScreenshot("vault-page-full.png", {
        fullPage: true,
        animations: "disabled",
      })
    })

    test("should match vault page with search results", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      // Perform a search
      await vaultPage.search("rose")
      await vaultPage.waitForLoadingComplete()

      await expect(page).toHaveScreenshot("vault-search-results.png", {
        fullPage: true,
        animations: "disabled",
      })
    })

    test("should match login page layout", async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()
      await loginPage.waitForReady()

      await expect(page).toHaveScreenshot("login-page.png", {
        fullPage: true,
        animations: "disabled",
      })
    })

    test("should match signup page layout", async ({ page }) => {
      const signupPage = new SignUpPage(page)
      await signupPage.navigateTo()
      await signupPage.waitForReady()

      await expect(page).toHaveScreenshot("signup-page.png", {
        fullPage: true,
        animations: "disabled",
      })
    })
  })

  test.describe("Component States", () => {
    test("should match button variants", async ({ page }) => {
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      // Find various button types
      const primaryButton = page.locator('button[type="submit"]').first()
      if ((await primaryButton.count()) > 0) {
        await expect(primaryButton).toHaveScreenshot("button-primary.png")
      }

      const secondaryButton = page.locator('button[class*="secondary"]').first()
      if ((await secondaryButton.count()) > 0) {
        await expect(secondaryButton).toHaveScreenshot("button-secondary.png")
      }
    })

    test("should match button hover states", async ({ page }) => {
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      const button = page.locator('button[type="submit"]').first()
      if ((await button.count()) > 0) {
        // Hover over button
        await button.hover()
        await page.waitForTimeout(200) // Wait for hover animation

        await expect(button).toHaveScreenshot("button-hover.png")
      }
    })

    test("should match form field states", async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()

      // Empty state
      const emailInput = page.locator('input[type="email"]').first()
      await expect(emailInput).toHaveScreenshot("input-empty.png")

      // Filled state
      await emailInput.fill("test@example.com")
      await expect(emailInput).toHaveScreenshot("input-filled.png")

      // Focus state
      await emailInput.focus()
      await expect(emailInput).toHaveScreenshot("input-focused.png")
    })

    test("should match form validation errors", async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()

      // Submit empty form to trigger validation
      await page.locator('button[type="submit"]').click()
      await page.waitForTimeout(500) // Wait for validation messages

      // Screenshot validation messages
      const errorMessages = page.locator('[role="alert"]')
      if ((await errorMessages.count()) > 0) {
        await expect(page).toHaveScreenshot("form-validation-errors.png", {
          animations: "disabled",
        })
      }
    })

    test("should match loading states", async ({ page }) => {
      await page.goto("/the-vault")

      // Try to capture loading spinner
      const loadingSpinner = page.locator('[data-testid="loading-spinner"]')
      if (await loadingSpinner.isVisible().catch(() => false)) {
        await expect(loadingSpinner).toHaveScreenshot("loading-spinner.png")
      }
    })

    test("should match modal dialogs", async ({ page }) => {
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      // Try to trigger a modal (adjust selector based on your app)
      const modalTrigger = page.locator('[data-testid="modal-trigger"]').first()
      if ((await modalTrigger.count()) > 0) {
        await modalTrigger.click()
        await page.waitForTimeout(500) // Wait for modal animation

        const modal = page.locator('[role="dialog"]')
        await expect(modal).toHaveScreenshot("modal-dialog.png")
      }
    })
  })

  test.describe("Navigation Components", () => {
    test("should match global navigation", async ({ page }) => {
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      const nav = page.locator("nav").first()
      await expect(nav).toHaveScreenshot("global-navigation.png", {
        animations: "disabled",
      })
    })

    test("should match mobile navigation", async ({ page, browserName }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      // Screenshot mobile nav
      const mobileNav = page.locator('[data-testid="mobile-navigation"]').first()
      if ((await mobileNav.count()) > 0) {
        await expect(mobileNav).toHaveScreenshot("mobile-navigation-closed.png")

        // Open mobile menu
        const menuButton = page.locator('[data-testid="menu-toggle"]').first()
        if ((await menuButton.count()) > 0) {
          await menuButton.click()
          await page.waitForTimeout(500) // Wait for animation

          await expect(mobileNav).toHaveScreenshot("mobile-navigation-open.png")
        }
      }
    })

    test("should match footer", async ({ page }) => {
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      const footer = page.locator("footer").first()
      if ((await footer.count()) > 0) {
        await expect(footer).toHaveScreenshot("footer.png", {
          animations: "disabled",
        })
      }
    })
  })

  test.describe("Card Components", () => {
    test("should match perfume cards", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      // Screenshot first perfume card
      const perfumeCard = page.locator('[data-testid="perfume-card"]').first()
      if ((await perfumeCard.count()) > 0) {
        await expect(perfumeCard).toHaveScreenshot("perfume-card.png", {
          animations: "disabled",
        })
      }
    })

    test("should match perfume card hover state", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      const perfumeCard = page.locator('[data-testid="perfume-card"]').first()
      if ((await perfumeCard.count()) > 0) {
        await perfumeCard.hover()
        await page.waitForTimeout(200) // Wait for hover animation

        await expect(perfumeCard).toHaveScreenshot("perfume-card-hover.png")
      }
    })

    test("should match link cards", async ({ page }) => {
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      const linkCard = page.locator('[data-testid="link-card"]').first()
      if ((await linkCard.count()) > 0) {
        await expect(linkCard).toHaveScreenshot("link-card.png")
      }
    })
  })

  test.describe("Interactive Elements", () => {
    test("should match rating stars", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForPerfumesToLoad()

      // Click on first perfume to go to detail page
      const firstCard = page.locator('[data-testid="perfume-card"]').first()
      if ((await firstCard.count()) > 0) {
        await firstCard.click()
        await page.waitForLoadState("networkidle")

        const ratingStars = page.locator('[data-testid="rating-stars"]').first()
        if ((await ratingStars.count()) > 0) {
          await expect(ratingStars).toHaveScreenshot("rating-stars.png")
        }
      }
    })

    test("should match dropdown menus", async ({ page }) => {
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      const dropdown = page.locator('[data-testid="dropdown"]').first()
      if ((await dropdown.count()) > 0) {
        // Closed state
        await expect(dropdown).toHaveScreenshot("dropdown-closed.png")

        // Open state
        await dropdown.click()
        await page.waitForTimeout(200) // Wait for animation

        await expect(dropdown).toHaveScreenshot("dropdown-open.png")
      }
    })

    test("should match search bar", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()

      const searchBar = page.locator('[data-testid="search-input"]').first()
      if ((await searchBar.count()) > 0) {
        // Empty state
        await expect(searchBar).toHaveScreenshot("search-bar-empty.png")

        // Filled state
        await searchBar.fill("rose")
        await expect(searchBar).toHaveScreenshot("search-bar-filled.png")
      }
    })

    test("should match tag filters", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await page.waitForLoadState("networkidle")

      const tagFilters = page.locator('[data-testid="tag-filters"]').first()
      if ((await tagFilters.count()) > 0) {
        await expect(tagFilters).toHaveScreenshot("tag-filters.png")
      }
    })
  })

  test.describe("Responsive Layouts", () => {
    test("should match mobile layout", async ({ page }) => {
      // iPhone 12 viewport
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      await expect(page).toHaveScreenshot("mobile-layout.png", {
        fullPage: true,
        animations: "disabled",
      })
    })

    test("should match tablet layout", async ({ page }) => {
      // iPad viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      await expect(page).toHaveScreenshot("tablet-layout.png", {
        fullPage: true,
        animations: "disabled",
      })
    })

    test("should match desktop layout", async ({ page }) => {
      // Desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      await expect(page).toHaveScreenshot("desktop-layout.png", {
        fullPage: true,
        animations: "disabled",
      })
    })

    test("should match vault mobile layout", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForReady()

      await expect(page).toHaveScreenshot("vault-mobile.png", {
        fullPage: true,
        animations: "disabled",
      })
    })
  })

  test.describe("Error States", () => {
    test("should match 404 page", async ({ page }) => {
      await page.goto("/this-page-does-not-exist")
      await page.waitForLoadState("networkidle")

      await expect(page).toHaveScreenshot("404-page.png", {
        fullPage: true,
        animations: "disabled",
      })
    })

    test("should match error boundary", async ({ page }) => {
      // Navigate to a page that might trigger an error boundary
      // This is a placeholder - adjust based on your app
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      // Check if error boundary is present
      const errorBoundary = page.locator('[data-testid="error-boundary"]').first()
      if ((await errorBoundary.count()) > 0) {
        await expect(errorBoundary).toHaveScreenshot("error-boundary.png")
      }
    })

    test("should match empty state", async ({ page }) => {
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()

      // Search for something that returns no results
      await vaultPage.search("zzzzzzzzzzzzzzzzz")
      await vaultPage.waitForLoadingComplete()

      const noResults = page.locator('[data-testid="no-results"]')
      if ((await noResults.count()) > 0) {
        await expect(noResults).toHaveScreenshot("empty-state.png")
      }
    })
  })

  test.describe("Dark Mode (if applicable)", () => {
    test("should match dark mode homepage", async ({ page }) => {
      // Enable dark mode if your app supports it
      await page.emulateMedia({ colorScheme: "dark" })
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      await expect(page).toHaveScreenshot("homepage-dark.png", {
        fullPage: true,
        animations: "disabled",
      })
    })

    test("should match dark mode vault page", async ({ page }) => {
      await page.emulateMedia({ colorScheme: "dark" })
      const vaultPage = new VaultPage(page)
      await vaultPage.navigateTo()
      await vaultPage.waitForReady()

      await expect(page).toHaveScreenshot("vault-dark.png", {
        fullPage: true,
        animations: "disabled",
      })
    })
  })

  test.describe("Print Styles (if applicable)", () => {
    test("should match print layout", async ({ page }) => {
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      // Emulate print media
      await page.emulateMedia({ media: "print" })

      await expect(page).toHaveScreenshot("print-layout.png", {
        fullPage: true,
        animations: "disabled",
      })
    })
  })

  test.describe("Animation States", () => {
    test("should match page transitions", async ({ page }) => {
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      // Navigate to another page
      const link = page.locator('a[href="/the-vault"]').first()
      if ((await link.count()) > 0) {
        await link.click()
        await page.waitForTimeout(100) // Capture during transition

        await expect(page).toHaveScreenshot("page-transition.png", {
          animations: "allow",
        })
      }
    })

    test("should match loading animations", async ({ page }) => {
      await page.goto("/the-vault")

      // Try to capture during loading
      const loadingState = page.locator('[data-testid="loading"]').first()
      if (await loadingState.isVisible().catch(() => false)) {
        await expect(page).toHaveScreenshot("loading-animation.png", {
          animations: "allow",
        })
      }
    })
  })

  test.describe("Accessibility States", () => {
    test("should match keyboard focus states", async ({ page }) => {
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      // Tab to first interactive element
      await page.keyboard.press("Tab")
      await page.waitForTimeout(100)

      const focusedElement = await page.evaluateHandle(() => document.activeElement)
      await expect(page).toHaveScreenshot("keyboard-focus.png", {
        animations: "disabled",
      })
    })

    test("should match high contrast mode", async ({ page }) => {
      // Enable high contrast (if your app supports it)
      await page.emulateMedia({ colorScheme: "dark" })
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      await expect(page).toHaveScreenshot("high-contrast.png", {
        fullPage: true,
        animations: "disabled",
      })
    })
  })
})
