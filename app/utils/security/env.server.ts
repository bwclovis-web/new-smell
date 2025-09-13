import { z } from "zod"

const securitySchema = z.object({
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters long"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  NODE_ENV: z.enum(["development", "production", "test"]),
  // Optional environment variables
  METRICS_PORT: z.string().optional(),
  APP_PORT: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  LOCAL_DATABASE_URL: z.string().url().optional(),
})

export function validateSecurityEnv() {
  const result = securitySchema.safeParse(process.env)
  if (!result.success) {
    const errorMessages = result.error.errors.map(err => `${err.path.join(".")}: ${err.message}`)
    throw new Error(`Security configuration error:\n${errorMessages.join("\n")}\n\nPlease check your environment variables and ensure all required secrets are properly set.`)
  }
  return result.data
}

// Validate environment on module load
export const env = validateSecurityEnv()
