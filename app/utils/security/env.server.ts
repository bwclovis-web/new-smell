import { z } from "zod"

// Core security schema for critical environment variables
const coreSecuritySchema = z.object({
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters long"),
  DATABASE_URL: z.string().refine(
    url => {
      // Check if it's a valid URL format or a Prisma Accelerate URL with prisma+postgres prefix
      if (url.startsWith('prisma+postgres://')) {
        return true // Skip URL validation for this special format
      }
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    },
    "DATABASE_URL must be a valid URL"
  ).refine(
    url => url.startsWith('postgresql://') || url.startsWith('prisma://') || url.startsWith('prisma+postgres://'),
    "DATABASE_URL must be either a PostgreSQL connection string (postgresql://), a Prisma Accelerate URL (prisma://), or a Prisma Accelerate URL with prisma+postgres prefix"
  ),
  NODE_ENV: z.enum(["development", "production", "test"]),
})

// Extended schema for all application environment variables
const extendedSchema = z.object({
  // Core security variables
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters long"),
  DATABASE_URL: z.string().refine(
    url => {
      // Check if it's a valid URL format or a Prisma Accelerate URL with prisma+postgres prefix
      if (url.startsWith('prisma+postgres://')) {
        return true // Skip URL validation for this special format
      }
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    },
    "DATABASE_URL must be a valid URL"
  ).refine(
    url => url.startsWith('postgresql://') || url.startsWith('prisma://') || url.startsWith('prisma+postgres://'),
    "DATABASE_URL must be either a PostgreSQL connection string (postgresql://), a Prisma Accelerate URL (prisma://), or a Prisma Accelerate URL with prisma+postgres prefix"
  ),
  NODE_ENV: z.enum(["development", "production", "test"]),

  // Server configuration
  METRICS_PORT: z.string().regex(/^\d+$/, "METRICS_PORT must be a valid port number").optional(),
  APP_PORT: z.string().regex(/^\d+$/, "APP_PORT must be a valid port number").optional(),

  // Database configuration
  LOCAL_DATABASE_URL: z.string().url("LOCAL_DATABASE_URL must be a valid URL").optional(),

  // AI/ML services
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY cannot be empty").optional(),
  OPENAI_MODEL: z.string().optional(),

  // Security features
  HONEYPOT_ENCRYPTION_SEED: z.string().min(16, "HONEYPOT_ENCRYPTION_SEED must be at least 16 characters").optional(),

  // Redis configuration
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().regex(/^\d+$/, "REDIS_PORT must be a valid port number").optional(),
  REDIS_PASSWORD: z.string().optional(),

  // Monitoring
  MONITORING_ENABLED: z.enum(["true", "false"]).optional(),

  // Testing
  TEST_DATABASE_URL: z.string().url("TEST_DATABASE_URL must be a valid URL").optional(),
  CI: z.enum(["true", "false"]).optional(),

  // Cerewai configuration
  MIN_REQUEST_DELAY: z.string().regex(/^\d+$/, "MIN_REQUEST_DELAY must be a number").optional(),
  OUTPUT_DIR: z.string().optional(),
  LOG_LEVEL: z.enum([
"DEBUG", "INFO", "WARN", "ERROR"
]).optional(),
  MAX_RETRIES: z.string().regex(/^\d+$/, "MAX_RETRIES must be a number").optional(),
  TIMEOUT: z.string().regex(/^\d+$/, "TIMEOUT must be a number").optional(),
})

// Validation functions
export function validateCoreSecurityEnv() {
  const result = coreSecuritySchema.safeParse(process.env)
  if (!result.success) {
    const errorMessages = result.error.errors.map(err => `${err.path.join(".")}: ${err.message}`)
    throw new Error(`Critical security configuration error:\n${errorMessages.join("\n")}\n\nPlease check your environment variables and ensure all required secrets are properly set.`)
  }
  return result.data
}

export function validateExtendedEnv() {
  const result = extendedSchema.safeParse(process.env)
  if (!result.success) {
    const errorMessages = result.error.errors.map(err => `${err.path.join(".")}: ${err.message}`)
    console.warn(`Environment validation warnings:\n${errorMessages.join("\n")}\n\nSome optional environment variables may not be properly configured.`)
  }
  return result.success ? result.data : null
}

// Legacy function for backward compatibility
export function validateSecurityEnv() {
  return validateCoreSecurityEnv()
}

// Validate environment on module load
export const env = validateCoreSecurityEnv()

// Type definitions for better TypeScript support
export type CoreEnv = z.infer<typeof coreSecuritySchema>
export type ExtendedEnv = z.infer<typeof extendedSchema>
