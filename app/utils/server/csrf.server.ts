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

// Get CSRF token from request (header first, then formData if provided)
export async function getCSRFTokenFromRequest(
  request: Request,
  formData?: FormData
): Promise<string | null> {
  const headerToken = request.headers.get(CSRF_HEADER_KEY)
  if (headerToken) return headerToken
  if (formData) return (formData.get("_csrf") as string) || null
  const fd = await request.formData()
  return (fd.get("_csrf") as string) || null
}

// Sync version when formData is already available (avoids consuming body twice)
export function getCSRFTokenFromRequestSync(
  request: Request,
  formData: FormData
): string | null {
  return (
    request.headers.get(CSRF_HEADER_KEY) ||
    (formData.get("_csrf") as string) ||
    null
  )
}

// Get CSRF token from cookies
export function getCSRFTokenFromCookies(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie")
  if (!cookieHeader) return null
  const cookies = cookie.parse(cookieHeader)
  return cookies[CSRF_COOKIE_KEY] || null
}

/**
 * Validate CSRF - use for React Router actions (form posts) that don't go through /api.
 * Token can be in x-csrf-token header or _csrf form field.
 * Prefer passing formData when you already have it to avoid double-parsing.
 */
export async function validateCSRF(
  request: Request,
  formData?: FormData
): Promise<boolean> {
  const token = formData
    ? getCSRFTokenFromRequestSync(request, formData)
    : await getCSRFTokenFromRequest(request)
  const sessionToken = getCSRFTokenFromCookies(request)
  if (!token || !sessionToken) return false
  return validateCSRFToken(token, sessionToken)
}

/**
 * Validate CSRF and throw 403 Response on failure.
 * Use at start of React Router actions for routes that don't go through /api.
 */
export async function requireCSRF(
  request: Request,
  formData?: FormData
): Promise<void> {
  const valid = await validateCSRF(request, formData)
  if (!valid) {
    throw new Response(
      JSON.stringify({ error: "CSRF token missing or invalid" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    )
  }
}

// Create CSRF cookie (double-submit pattern: must be readable by JS)
// Matches setCSRFCookie in csrf-middleware.server.js for consistency
export function createCSRFCookie(token: string): string {
  return cookie.serialize(CSRF_COOKIE_KEY, token, {
    httpOnly: false, // Double-submit: client reads cookie, sends in header
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 24 hours
  })
}
