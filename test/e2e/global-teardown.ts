import { FullConfig } from '@playwright/test'

/**
 * Global teardown for E2E tests
 * This runs once after all tests complete
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test global teardown...')

  try {
    // Clean up any test data or resources
    console.log('✅ Global teardown completed successfully')
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw here as it might mask test failures
  }
}

export default globalTeardown
