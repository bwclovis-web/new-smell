import { createCookie } from 'react-router';
import { CSRF, CSRFError } from 'remix-utils/csrf/server'

export const CSRF_COOKIE_KEY = '_csrf'

const csfrCookie = createCookie(CSRF_COOKIE_KEY, {
  httpOnly: true,
  path: '/',
  sameSite: 'lax',
  secrets: [process.env.SESSION_SECRET || 'NOT_A_STRONG_SECRET'],
  secure: process.env.NODE_ENV === 'production'
})

export const csrf = new CSRF({
  cookie: csfrCookie
})

export async function validateCSRF(formData: FormData, headers: Headers) {
  try {
    await csrf.validate(formData, headers)
  } catch (err: unknown) {
    if (err instanceof CSRFError) {
      throw new Response('Invalid CSRF token', { status: 403 })
    }
    throw err
  }
}
