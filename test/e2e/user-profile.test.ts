import { expect, test } from "@playwright/test"

import { HomePage } from "./pages/HomePage"
import { LoginPage } from "./pages/LoginPage"
import { SignUpPage } from "./pages/SignUpPage"

test.describe("User Profile & Preferences", () => {
  test.describe("Profile Management", () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()
      await loginPage.login("test@example.com", "TestPassword123!")
      await expect(page).toHaveURL(/\/(?!login)/)
    })

    test("should access profile settings", async ({ page }) => {
      // Navigate to profile/settings
      await page.goto("/profile")

      // Should load profile page
      await expect(page).toHaveURL(/profile/)
      await expect(page.locator("h1, h2")).toContainText(/profile|settings/i)
    })

    test("should display user information", async ({ page }) => {
      await page.goto("/profile")

      // Should display email
      await expect(page.locator("text=test@example.com")).toBeVisible()
    })

    test("should update profile information", async ({ page }) => {
      await page.goto("/profile")

      // Fill out profile form
      await page.fill('[name="firstName"]', "Updated")
      await page.fill('[name="lastName"]', "User")

      // Submit form
      await page.click('button[type="submit"]')

      // Should show success message
      await expect(page.locator("text=/updated|success/i")).toBeVisible()
    })

    test("should change password", async ({ page }) => {
      await page.goto("/profile")

      // Find change password section
      await page.click("text=Change Password")

      // Fill out password form
      await page.fill('[name="currentPassword"]', "TestPassword123!")
      await page.fill('[name="newPassword"]', "NewPassword123!")
      await page.fill('[name="confirmPassword"]', "NewPassword123!")

      // Submit
      await page.click('button:has-text("Change Password")')

      // Should show success
      await expect(page.locator("text=/password changed|success/i")).toBeVisible()
    })

    test("should validate password strength when changing password", async ({
      page,
    }) => {
      await page.goto("/profile")

      // Find change password section
      await page.click("text=Change Password")

      // Enter weak password
      await page.fill('[name="newPassword"]', "123")

      // Should show weak password indicator
      await expect(page.locator("text=/weak|strength/i")).toBeVisible()
    })

    test("should require current password to change password", async ({ page }) => {
      await page.goto("/profile")

      // Find change password section
      await page.click("text=Change Password")

      // Try to change without current password
      await page.fill('[name="newPassword"]', "NewPassword123!")
      await page.fill('[name="confirmPassword"]', "NewPassword123!")
      await page.click('button:has-text("Change Password")')

      // Should show error
      await expect(page.locator("text=/current password|required/i")).toBeVisible()
    })
  })

  test.describe("Notification Preferences", () => {
    test.beforeEach(async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()
      await loginPage.login("test@example.com", "TestPassword123!")
    })

    test("should access notification settings", async ({ page }) => {
      await page.goto("/profile/notifications")

      // Should load notifications page
      await expect(page).toHaveURL(/notifications/)
    })

    test("should toggle email notifications", async ({ page }) => {
      await page.goto("/profile/notifications")

      // Find email notification toggle
      const emailToggle = page.locator('[data-testid="email-notifications"]')
      const initialState = await emailToggle.isChecked()

      // Toggle it
      await emailToggle.click()

      // Should change state
      const newState = await emailToggle.isChecked()
      expect(newState).not.toBe(initialState)
    })

    test("should toggle wishlist notifications", async ({ page }) => {
      await page.goto("/profile/notifications")

      // Find wishlist notification toggle
      const wishlistToggle = page.locator('[data-testid="wishlist-notifications"]')

      // Toggle it
      await wishlistToggle.click()

      // Should show success or save automatically
      await page.waitForTimeout(500)
    })

    test("should save notification preferences", async ({ page }) => {
      await page.goto("/profile/notifications")

      // Toggle some notifications
      await page.click('[data-testid="email-notifications"]')
      await page.click('[data-testid="wishlist-notifications"]')

      // Save if there's a save button
      const saveButton = page.locator('button:has-text("Save")')
      if (await saveButton.isVisible()) {
        await saveButton.click()
        await expect(page.locator("text=/saved|success/i")).toBeVisible()
      }
    })
  })

  test.describe("Privacy Settings", () => {
    test.beforeEach(async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()
      await loginPage.login("test@example.com", "TestPassword123!")
    })

    test("should access privacy settings", async ({ page }) => {
      await page.goto("/profile/privacy")

      // Should load privacy page
      await expect(page).toHaveURL(/privacy/)
    })

    test("should toggle profile visibility", async ({ page }) => {
      await page.goto("/profile/privacy")

      // Find profile visibility toggle
      const visibilityToggle = page.locator('[data-testid="profile-visibility"]')

      if (await visibilityToggle.isVisible()) {
        const initialState = await visibilityToggle.isChecked()
        await visibilityToggle.click()

        const newState = await visibilityToggle.isChecked()
        expect(newState).not.toBe(initialState)
      }
    })

    test("should toggle collection visibility", async ({ page }) => {
      await page.goto("/profile/privacy")

      // Find collection visibility toggle
      const collectionToggle = page.locator('[data-testid="collection-visibility"]')

      if (await collectionToggle.isVisible()) {
        await collectionToggle.click()
        await page.waitForTimeout(500)
      }
    })
  })

  test.describe("Account Management", () => {
    test.beforeEach(async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()
      await loginPage.login("test@example.com", "TestPassword123!")
    })

    test("should view account information", async ({ page }) => {
      await page.goto("/profile/account")

      // Should show account details
      await expect(page.locator("text=/account|email/i")).toBeVisible()
    })

    test("should show account creation date", async ({ page }) => {
      await page.goto("/profile/account")

      // Should display when account was created
      await expect(page.locator("text=/member since|joined/i")).toBeVisible()
    })

    test("should access delete account option", async ({ page }) => {
      await page.goto("/profile/account")

      // Find delete account button
      const deleteButton = page.locator("text=/delete account|close account/i")

      if (await deleteButton.isVisible()) {
        await deleteButton.click()

        // Should show confirmation dialog
        await expect(page.locator("text=/confirm|sure|delete/i")).toBeVisible()
      }
    })

    test("should cancel account deletion", async ({ page }) => {
      await page.goto("/profile/account")

      const deleteButton = page.locator("text=/delete account|close account/i")

      if (await deleteButton.isVisible()) {
        await deleteButton.click()

        // Click cancel
        await page.click('button:has-text("Cancel")')

        // Should remain on account page
        await expect(page).toHaveURL(/account/)
      }
    })
  })

  test.describe("Session Management", () => {
    test("should logout successfully", async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()
      await loginPage.login("test@example.com", "TestPassword123!")

      // Click logout
      await page.click("text=/logout|sign out/i")

      // Should redirect to home or login
      await expect(page).toHaveURL(/\/(?!profile)/)
    })

    test("should maintain session across pages", async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()
      await loginPage.login("test@example.com", "TestPassword123!")

      // Navigate to different pages
      await page.goto("/the-vault")
      await page.goto("/profile")
      await page.goto("/")

      // Should still be logged in
      await expect(page.locator("text=/logout|profile/i")).toBeVisible()
    })

    test("should redirect to login when accessing protected route", async ({
      page,
    }) => {
      // Try to access profile without logging in
      await page.goto("/profile")

      // Should redirect to login
      await expect(page).toHaveURL(/login/)
    })
  })

  test.describe("User Registration Edge Cases", () => {
    test("should prevent registration with existing email", async ({ page }) => {
      const signUpPage = new SignUpPage(page)
      await signUpPage.navigateTo()

      // Try to register with existing email
      await signUpPage.fillForm({
        email: "test@example.com", // Already exists
        password: "TestPassword123!",
        confirmPassword: "TestPassword123!",
        firstName: "Test",
        lastName: "User",
      })

      await signUpPage.submit()

      // Should show error
      await expect(page.locator("text=/already exists|email taken/i")).toBeVisible()
    })

    test("should validate email format", async ({ page }) => {
      const signUpPage = new SignUpPage(page)
      await signUpPage.navigateTo()

      // Enter invalid email
      await page.fill('[name="email"]', "invalid-email")
      await page.blur('[name="email"]')

      // Should show validation error
      await expect(page.locator("text=/invalid email|valid email/i")).toBeVisible()
    })

    test("should require password confirmation match", async ({ page }) => {
      const signUpPage = new SignUpPage(page)
      await signUpPage.navigateTo()

      await signUpPage.fillForm({
        email: "newuser@example.com",
        password: "TestPassword123!",
        confirmPassword: "DifferentPassword123!",
        firstName: "Test",
        lastName: "User",
      })

      // Should show error about password mismatch
      await expect(page.locator("text=/passwords.*match|match.*password/i")).toBeVisible()
    })

    test("should enforce minimum password length", async ({ page }) => {
      const signUpPage = new SignUpPage(page)
      await signUpPage.navigateTo()

      await page.fill('[name="password"]', "12")
      await page.blur('[name="password"]')

      // Should show error
      await expect(page.locator("text=/password.*short|minimum.*characters/i")).toBeVisible()
    })
  })

  test.describe("Login Security", () => {
    test("should show error for non-existent user", async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()

      await loginPage.login("nonexistent@example.com", "password123")

      // Should show error
      await expect(loginPage.hasErrorMessage()).resolves.toBe(true)
    })

    test("should show error for wrong password", async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()

      await loginPage.login("test@example.com", "wrongpassword")

      // Should show error
      await expect(loginPage.hasErrorMessage()).resolves.toBe(true)
    })

    test("should clear error on retry", async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()

      // First attempt with wrong password
      await loginPage.login("test@example.com", "wrongpassword")
      await expect(loginPage.hasErrorMessage()).resolves.toBe(true)

      // Second attempt with correct password
      await loginPage.login("test@example.com", "TestPassword123!")

      // Should login successfully
      await expect(page).toHaveURL(/\/(?!login)/)
    })

    test("should not expose whether email exists", async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()

      // Try non-existent email
      await loginPage.login("nonexistent@example.com", "password")
      const error1 = await page
        .locator('[data-testid="error-message"]')
        .textContent()

      // Try existing email with wrong password
      await loginPage.navigateTo()
      await loginPage.login("test@example.com", "wrongpassword")
      const error2 = await page
        .locator('[data-testid="error-message"]')
        .textContent()

      // Error messages should be similar (security best practice)
      expect(error1).toContain("invalid")
      expect(error2).toContain("invalid")
    })
  })

  test.describe("Mobile Profile Management", () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test("should access profile on mobile", async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()
      await loginPage.login("test@example.com", "TestPassword123!")

      await page.goto("/profile")

      // Should load on mobile
      await expect(page).toHaveURL(/profile/)
    })

    test("should update profile on mobile", async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()
      await loginPage.login("test@example.com", "TestPassword123!")

      await page.goto("/profile")

      // Fill form on mobile
      await page.fill('[name="firstName"]', "Mobile")
      await page.fill('[name="lastName"]', "User")

      await page.click('button[type="submit"]')

      // Should show success
      await expect(page.locator("text=/updated|success/i")).toBeVisible()
    })

    test("should logout on mobile", async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.navigateTo()
      await loginPage.login("test@example.com", "TestPassword123!")

      // Open mobile menu
      await page.click('[data-testid="mobile-menu-button"]')

      // Click logout
      await page.click("text=/logout|sign out/i")

      // Should redirect
      await expect(page).toHaveURL(/\/(?!profile)/)
    })
  })
})
