import cookie from "cookie"
import crypto from "crypto"

export const CSRF_COOKIE_KEY = "_csrf"
export const CSRF_HEADER_KEY = "x-csrf-token"

// Generate a secure CSRF token
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Validate CSRF token
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) {
    return false
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(token, "hex"),
      Buffer.from(sessionToken, "hex")
    )
  } catch {
    return false
  }
}

// Get CSRF token from request
export function getCSRFTokenFromRequest(request: Request): string | null {
  // Try to get from header first
  const headerToken = request.headers.get(CSRF_HEADER_KEY)
  if (headerToken) {
    return headerToken
  }

  // Try to get from form data
  const formData = request.formData ? request.formData() : null
  if (formData) {
    return formData
      .then((data) => (data.get("_csrf") as string) || null)
      .catch(() => null)
  }

  return null
}

// Get CSRF token from cookies
export function getCSRFTokenFromCookies(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie")
  if (!cookieHeader) {
    return null
  }

  const cookies = cookie.parse(cookieHeader)
  return cookies[CSRF_COOKIE_KEY] || null
}

// Validate CSRF for form submissions
export async function validateCSRF(request: Request): Promise<boolean> {
  const formData = await request.formData()
  const token = formData.get("_csrf") as string
  const sessionToken = getCSRFTokenFromCookies(request)

  if (!token || !sessionToken) {
    return false
  }

  return validateCSRFToken(token, sessionToken)
}

// Create CSRF cookie
export function createCSRFCookie(token: string): string {
  return cookie.serialize(CSRF_COOKIE_KEY, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 24 hours
  })
}
