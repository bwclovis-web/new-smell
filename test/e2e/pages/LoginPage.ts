import { Page } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * Login page object model
 */
export class LoginPage extends BasePage {
  // Selectors
  private readonly selectors = {
    emailInput: '[data-testid="email-input"]',
    passwordInput: '[data-testid="password-input"]',
    loginButton: '[data-testid="login-button"]',
    signUpLink: '[data-testid="signup-link"]',
    forgotPasswordLink: '[data-testid="forgot-password-link"]',
    errorMessage: '[data-testid="error-message"]',
    successMessage: '[data-testid="success-message"]',
    loadingSpinner: '[data-testid="loading-spinner"]',
    form: '[data-testid="login-form"]'
  }

  constructor(page: Page) {
    super(page)
  }

  /**
   * Navigate to the login page
   */
  async navigateTo(): Promise<void> {
    await this.helpers.navigateTo('/login')
    await this.waitForReady()
  }

  /**
   * Fill in login credentials
   */
  async fillCredentials(email: string, password: string): Promise<void> {
    await this.helpers.fillField(this.selectors.emailInput, email)
    await this.helpers.fillField(this.selectors.passwordInput, password)
  }

  /**
   * Click the login button
   */
  async clickLogin(): Promise<void> {
    await this.helpers.clickAndWait(this.selectors.loginButton, true)
    await this.waitForReady()
  }

  /**
   * Perform complete login flow
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillCredentials(email, password)
    await this.clickLogin()
  }

  /**
   * Click sign up link
   */
  async clickSignUp(): Promise<void> {
    await this.helpers.clickAndWait(this.selectors.signUpLink, true)
    await this.waitForReady()
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword(): Promise<void> {
    await this.helpers.clickAndWait(this.selectors.forgotPasswordLink, true)
    await this.waitForReady()
  }

  /**
   * Check if error message is visible
   */
  async hasErrorMessage(): Promise<boolean> {
    return await this.helpers.elementExists(this.selectors.errorMessage)
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    const element = this.page.locator(this.selectors.errorMessage)
    return await element.textContent() || ''
  }

  /**
   * Check if success message is visible
   */
  async hasSuccessMessage(): Promise<boolean> {
    return await this.helpers.elementExists(this.selectors.successMessage)
  }

  /**
   * Check if loading spinner is visible
   */
  async isLoading(): Promise<boolean> {
    return await this.helpers.elementExists(this.selectors.loadingSpinner)
  }

  /**
   * Wait for login form to be ready
   */
  async waitForFormReady(): Promise<void> {
    await this.helpers.waitForClickable(this.selectors.form)
  }

  /**
   * Assert login form is visible
   */
  async assertFormVisible(): Promise<void> {
    await this.helpers.assertVisible(this.selectors.form)
  }

  /**
   * Assert error message contains expected text
   */
  async assertErrorMessage(expectedText: string): Promise<void> {
    await this.helpers.assertText(this.selectors.errorMessage, expectedText)
  }

  /**
   * Assert successful login redirect
   */
  async assertLoginSuccess(): Promise<void> {
    // Should redirect away from login page
    await this.helpers.assertURL('/(?!login)')
  }
}
