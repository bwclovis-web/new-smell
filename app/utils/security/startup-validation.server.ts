import { validateCoreSecurityEnv, validateExtendedEnv } from './env.server'

/**
 * Comprehensive environment validation that runs at application startup
 * This ensures all critical environment variables are properly configured
 * before the application starts serving requests
 */
export function validateEnvironmentAtStartup() {
  console.log('🔍 Validating environment configuration...')

  try {
    // Validate core security variables (required)
    const coreEnv = validateCoreSecurityEnv()
    console.log('✅ Core security environment variables validated')

    // Validate extended environment variables (optional)
    const extendedEnv = validateExtendedEnv()
    if (extendedEnv) {
      console.log('✅ Extended environment variables validated')
    } else {
      console.log('⚠️  Some optional environment variables may need attention')
    }

    // Additional security checks
    validateSecurityRequirements(coreEnv)

    console.log('✅ Environment validation completed successfully')
    return { coreEnv, extendedEnv }

  } catch (error) {
    console.error('❌ Environment validation failed:')
    console.error(error instanceof Error ? error.message : 'Unknown error')
    process.exit(1)
  }
}

/**
 * Additional security-specific validations
 */
function validateSecurityRequirements(env: any) {
  // Check for development vs production security settings
  if (env.NODE_ENV === 'production') {
    // In production, ensure we have strong secrets
    if (env.JWT_SECRET.length < 64) {
      console.warn('⚠️  JWT_SECRET should be at least 64 characters in production')
    }
    if (env.SESSION_SECRET.length < 64) {
      console.warn('⚠️  SESSION_SECRET should be at least 64 characters in production')
    }
  }

  // Check for common security anti-patterns
  const commonWeakSecrets = [
    'your_jwt_secret_key',
    'your_session_secret',
    'secret',
    'password',
    '123456',
    'changeme'
  ]

  if (commonWeakSecrets.includes(env.JWT_SECRET)) {
    throw new Error('JWT_SECRET appears to be a default/weak value. Please use a strong, unique secret.')
  }

  if (commonWeakSecrets.includes(env.SESSION_SECRET)) {
    throw new Error('SESSION_SECRET appears to be a default/weak value. Please use a strong, unique secret.')
  }

  // Validate database URL format
  if (!env.DATABASE_URL.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must be a PostgreSQL connection string')
  }

  // Check for localhost in production
  if (env.NODE_ENV === 'production' && env.DATABASE_URL.includes('localhost')) {
    console.warn('⚠️  DATABASE_URL contains localhost in production - this may be incorrect')
  }
}

/**
 * Generate a secure secret for development
 */
export function generateSecureSecret(length: number = 64): string {
  const crypto = require('crypto')
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Validate a single environment variable
 */
export function validateSingleEnvVar(key: string, value: string | undefined, rules: {
  required?: boolean
  minLength?: number
  pattern?: RegExp
  customValidator?: (value: string) => boolean
}): { isValid: boolean; error?: string } {
  if (rules.required && (!value || value.trim() === '')) {
    return { isValid: false, error: `${key} is required but not set` }
  }

  if (value && rules.minLength && value.length < rules.minLength) {
    return { isValid: false, error: `${key} must be at least ${rules.minLength} characters long` }
  }

  if (value && rules.pattern && !rules.pattern.test(value)) {
    return { isValid: false, error: `${key} does not match required pattern` }
  }

  if (value && rules.customValidator && !rules.customValidator(value)) {
    return { isValid: false, error: `${key} failed custom validation` }
  }

  return { isValid: true }
}
