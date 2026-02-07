import cookie from "cookie"
import jwt from "jsonwebtoken"

// Validate environment variables on startup
function validateJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is required but not set. " +
        "Please set a secure JWT secret (minimum 32 characters) in your environment variables.")
  }
  if (jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long for security. " +
        "Current length: " +
        jwtSecret.length)
  }
  return jwtSecret
}

const JWT_SECRET = validateJwtSecret()

// Legacy functions for backward compatibility
export function signJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "60m" })
}

export function verifyJwt(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    // Check if it's an access token
    if (payload.type === "access") {
      return payload
    }
    return null
  } catch {
    return null
  }
}

export function parseCookies(req) {
  const cookieHeader = req.headers.cookie || ""
  return cookie.parse(cookieHeader)
}

// Canonical cookie names; temporary legacy fallback for migration (Fix #2)
const ACCESS_TOKEN_COOKIE = "accessToken"
const LEGACY_TOKEN_COOKIE = "token"

/**
 * Get session from parsed cookies (Express req).
 * Mirrors app/utils/session-from-request.server.ts for API server context.
 * @param {object} req - Express request with req.headers.cookie
 * @param {{ includeUser?: boolean }} [options]
 * @returns {Promise<{ userId: string, user?: object } | null>}
 */
export async function getSessionFromExpressRequest(req, options = {}) {
  const { includeUser = false } = options
  const cookies = parseCookies(req)
  const accessToken = cookies[ACCESS_TOKEN_COOKIE] || cookies[LEGACY_TOKEN_COOKIE]

  if (!accessToken) {
    return null
  }

  const payload = verifyJwt(accessToken)
  if (!payload || !payload.userId) {
    return null
  }

  const result = { userId: payload.userId }

  if (includeUser) {
    const { getUserById } = await import("../app/models/user.query.js")
    const fullUser = await getUserById(payload.userId)
    if (fullUser) {
      result.user = {
        id: fullUser.id,
        email: fullUser.email,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        username: fullUser.username,
        role: fullUser.role,
      }
    }
  }

  return result
}
