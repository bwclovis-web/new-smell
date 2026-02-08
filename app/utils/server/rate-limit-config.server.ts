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

/**
 * Rate limits for signup and subscribe (abuse prevention).
 * Environment variables (optional):
 * - SIGNUP_RATE_LIMIT_MAX: max signup attempts per window (default: 5)
 * - SIGNUP_RATE_LIMIT_WINDOW_MINUTES: window in minutes (default: 15)
 * - SUBSCRIBE_RATE_LIMIT_MAX: max checkout attempts per window (default: 10)
 * - SUBSCRIBE_RATE_LIMIT_WINDOW_MINUTES: window in minutes (default: 15)
 */
export interface SignupSubscribeRateLimits {
  signup: RateLimitConfig
  subscribe: RateLimitConfig
}

export function getSignupSubscribeRateLimits(): SignupSubscribeRateLimits {
  const signupMax = parseInt(process.env.SIGNUP_RATE_LIMIT_MAX || "5", 10)
  const signupWindowMin = parseInt(
    process.env.SIGNUP_RATE_LIMIT_WINDOW_MINUTES || "15",
    10
  )
  const subscribeMax = parseInt(
    process.env.SUBSCRIBE_RATE_LIMIT_MAX || "10",
    10
  )
  const subscribeWindowMin = parseInt(
    process.env.SUBSCRIBE_RATE_LIMIT_WINDOW_MINUTES || "15",
    10
  )

  return {
    signup: {
      max: signupMax,
      windowMs: signupWindowMin * 60 * 1000,
    },
    subscribe: {
      max: subscribeMax,
      windowMs: subscribeWindowMin * 60 * 1000,
    },
  }
}
