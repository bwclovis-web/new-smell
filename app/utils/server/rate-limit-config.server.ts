/**
 * Rate limit configuration for contact trader messages
 *
 * Environment variables:
 * - CONTACT_MESSAGE_RATE_LIMIT_PER_HOUR: Messages per hour per user (default: 10)
 * - CONTACT_MESSAGE_RATE_LIMIT_PER_DAY_PER_PAIR: Messages per day per trader pair (default: 3)
 */

export interface RateLimitConfig {
  max: number
  windowMs: number
}

export interface ContactMessageRateLimits {
  perUser: RateLimitConfig
  perPair: RateLimitConfig
}

export interface RateLimitMessages {
  perUser: string
  perPair: string
}

/**
 * Get rate limit configuration for contact messages
 */
export function getContactMessageRateLimits(): ContactMessageRateLimits {
  // Per-user rate limit: messages per hour
  const perUserMax = parseInt(
    process.env.CONTACT_MESSAGE_RATE_LIMIT_PER_HOUR || "10",
    10
  )
  const perUserWindowMs = 60 * 60 * 1000 // 1 hour

  // Per-pair rate limit: messages per day per trader pair
  const perPairMax = parseInt(
    process.env.CONTACT_MESSAGE_RATE_LIMIT_PER_DAY_PER_PAIR || "3",
    10
  )
  const perPairWindowMs = 24 * 60 * 60 * 1000 // 24 hours

  return {
    perUser: {
      max: perUserMax,
      windowMs: perUserWindowMs,
    },
    perPair: {
      max: perPairMax,
      windowMs: perPairWindowMs,
    },
  }
}

/**
 * Get user-friendly rate limit messages
 */
export function getRateLimitMessages(): RateLimitMessages {
  const limits = getContactMessageRateLimits()

  const perUserMessage = `You can send up to ${limits.perUser.max} message${limits.perUser.max !== 1 ? "s" : ""} per hour`
  const perPairMessage = `You can send up to ${limits.perPair.max} message${limits.perPair.max !== 1 ? "s" : ""} per day to this trader`

  return {
    perUser: perUserMessage,
    perPair: perPairMessage,
  }
}
