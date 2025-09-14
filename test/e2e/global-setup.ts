import { chromium, FullConfig } from '@playwright/test'

/**
 * Global setup for E2E tests
 * This runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test global setup...')

  // Start a browser to test the application is running
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Wait for the application to be ready
    const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:2112'
    console.log(`🔍 Checking application at ${baseURL}...`)

    // Navigate to the application and wait for it to load
    await page.goto(baseURL, { waitUntil: 'networkidle' })

    // Check if the application is responding
    const title = await page.title()
    console.log(`✅ Application is running with title: ${title}`)

    // Verify the application is not showing an error page
    const bodyText = await page.textContent('body')
    if (bodyText?.includes('Error') || bodyText?.includes('Not Found')) {
      throw new Error('Application appears to be showing an error page')
    }

    console.log('✅ Global setup completed successfully')

  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup
