import crypto from 'crypto'
import cookie from 'cookie'

const CSRF_COOKIE_KEY = '_csrf'
const CSRF_HEADER_KEY = 'x-csrf-token'

// Generate a secure CSRF token
export function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex')
}

// Validate CSRF token
export function validateCSRFToken(token, sessionToken) {
  if (!token || !sessionToken) {
    return false
  }
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(sessionToken, 'hex')
    )
  } catch {
    return false
  }
}

// CSRF middleware for Express
export function csrfMiddleware(req, res, next) {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next()
  }
  
  // Skip CSRF for API routes that don't need it (like metrics)
  if (req.path.startsWith('/metrics') || req.path.startsWith('/api/health')) {
    return next()
  }
  
  // Skip CSRF for React Router internal requests
  // React Router makes internal requests for data loading that shouldn't be CSRF protected
  if (req.headers['x-react-router'] || req.headers['x-remix-revalidate']) {
    return next()
  }
  
  // Skip CSRF for static assets and build files
  if (req.path.startsWith('/assets/') || req.path.startsWith('/build/') || req.path.startsWith('/node_modules/')) {
    return next()
  }
  
  // Skip CSRF for Vite dev server requests
  if (req.path.startsWith('/@') || req.path.startsWith('/src/') || req.path.includes('.js') || req.path.includes('.css')) {
    return next()
  }
  
  const token = req.headers[CSRF_HEADER_KEY] || req.body?._csrf
  const sessionToken = req.cookies?.[CSRF_COOKIE_KEY]
  
  if (!token || !sessionToken) {
    return res.status(403).json({ 
      error: 'CSRF token missing',
      message: 'Invalid or missing CSRF token' 
    })
  }
  
  if (!validateCSRFToken(token, sessionToken)) {
    return res.status(403).json({ 
      error: 'CSRF token invalid',
      message: 'Invalid CSRF token' 
    })
  }
  
  next()
}

// Generate and set CSRF token cookie
export function setCSRFCookie(res, token) {
  const csrfCookie = cookie.serialize(CSRF_COOKIE_KEY, token, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 // 24 hours
  })
  
  res.setHeader('Set-Cookie', csrfCookie)
}

// Get CSRF token from request
export function getCSRFTokenFromRequest(req) {
  return req.headers[CSRF_HEADER_KEY] || req.body?._csrf || req.query?._csrf
}
