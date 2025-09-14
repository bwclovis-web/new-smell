import { Page } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * Sign up page object model
 */
export class SignUpPage extends BasePage {
  // Selectors
  private readonly selectors = {
    emailInput: '[data-testid="email-input"]',
    passwordInput: '[data-testid="password-input"]',
    confirmPasswordInput: '[data-testid="confirm-password-input"]',
    firstNameInput: '[data-testid="first-name-input"]',
    lastNameInput: '[data-testid="last-name-input"]',
    signUpButton: '[data-testid="signup-button"]',
    loginLink: '[data-testid="login-link"]',
    errorMessage: '[data-testid="error-message"]',
    successMessage: '[data-testid="success-message"]',
    loadingSpinner: '[data-testid="loading-spinner"]',
    form: '[data-testid="signup-form"]',
    passwordStrengthIndicator: '[data-testid="password-strength"]',
    termsCheckbox: '[data-testid="terms-checkbox"]'
  }

  constructor(page: Page) {
    super(page)
  }

  /**
   * Navigate to the sign up page
   */
  async navigateTo(): Promise<void> {
    await this.helpers.navigateTo('/login')
    await this.waitForReady()
    await this.clickSignUpTab()
  }

  /**
   * Click sign up tab (if on login page)
   */
  async clickSignUpTab(): Promise<void> {
    await this.helpers.clickAndWait('[data-testid="signup-tab"]')
    await this.waitForReady()
  }

  /**
   * Fill in sign up form
   */
  async fillForm(data: {
    email: string
    password: string
    confirmPassword: string
    firstName: string
    lastName: string
  }): Promise<void> {
    await this.helpers.fillField(this.selectors.emailInput, data.email)
    await this.helpers.fillField(this.selectors.passwordInput, data.password)
    await this.helpers.fillField(this.selectors.confirmPasswordInput, data.confirmPassword)
    await this.helpers.fillField(this.selectors.firstNameInput, data.firstName)
    await this.helpers.fillField(this.selectors.lastNameInput, data.lastName)
  }

  /**
   * Accept terms and conditions
   */
  async acceptTerms(): Promise<void> {
    await this.page.check(this.selectors.termsCheckbox)
  }

  /**
   * Click the sign up button
   */
  async clickSignUp(): Promise<void> {
    await this.helpers.clickAndWait(this.selectors.signUpButton, true)
    await this.waitForReady()
  }

  /**
   * Perform complete sign up flow
   */
  async signUp(data: {
    email: string
    password: string
    confirmPassword: string
    firstName: string
    lastName: string
  }): Promise<void> {
    await this.fillForm(data)
    await this.acceptTerms()
    await this.clickSignUp()
  }

  /**
   * Click login link
   */
  async clickLogin(): Promise<void> {
    await this.helpers.clickAndWait(this.selectors.loginLink, true)
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
   * Check password strength indicator
   */
  async getPasswordStrength(): Promise<string> {
    const element = this.page.locator(this.selectors.passwordStrengthIndicator)
    return await element.textContent() || ''
  }

  /**
   * Wait for sign up form to be ready
   */
  async waitForFormReady(): Promise<void> {
    await this.helpers.waitForClickable(this.selectors.form)
  }

  /**
   * Assert sign up form is visible
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
   * Assert successful sign up redirect
   */
  async assertSignUpSuccess(): Promise<void> {
    // Should redirect away from sign up page
    await this.helpers.assertURL('/(?!login)')
  }

  /**
   * Assert password strength indicator shows expected level
   */
  async assertPasswordStrength(expectedLevel: string): Promise<void> {
    await this.helpers.assertText(this.selectors.passwordStrengthIndicator, expectedLevel)
  }
}
