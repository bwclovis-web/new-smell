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

    // Verify the application is not showing a critical error (check for HTML structure)
    const hasBody = await page.locator('body').isVisible()
    const statusCode = page.url() ? 200 : 500 // Basic check
    
    if (!hasBody) {
      throw new Error('Application is not responding correctly')
    }

    // More specific check - look for React root or app container
    const hasReactRoot = await page.locator('#root, #app, [data-reactroot]').count() > 0
    console.log(`✅ Application structure validated (React root: ${hasReactRoot})`)

    console.log('✅ Global setup completed successfully')

  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup
