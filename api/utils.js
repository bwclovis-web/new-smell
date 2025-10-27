import cookie from 'cookie'
import jwt from 'jsonwebtoken'

// Validate environment variables on startup
function validateJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required but not set. ' +
      'Please set a secure JWT secret (minimum 32 characters) in your environment variables.')
  }
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long for security. ' +
      'Current length: ' + jwtSecret.length)
  }
  return jwtSecret
}

const JWT_SECRET = validateJwtSecret()

// Legacy functions for backward compatibility
export function signJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '60m' })
}

export function verifyJwt(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    // Check if it's an access token
    if (payload.type === 'access') {
      return payload
    }
    return null
  } catch {
    return null
  }
}

export function parseCookies(req) {
  const cookieHeader = req.headers.cookie || ''
  return cookie.parse(cookieHeader)
}
