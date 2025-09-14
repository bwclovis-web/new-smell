/* eslint-disable max-statements */
import { redirect } from 'react-router'
import cookie from 'cookie'

import { getUserById } from '~/models/user.server'
import { ROUTE_PATH as SIGN_IN } from '~/routes/login/SignInPage'
import { createSafeUser } from '~/types'
import { refreshSession, verifyAccessToken } from '~/utils/security/session-manager.server'

export const sharedLoader = async (request: Request) => {
  const cookieHeader = request.headers.get('cookie') || ''

  // Parse cookies correctly
  const cookies = cookie.parse(cookieHeader)

  // Debug logging
  console.log('🔍 Auth Debug:', {
    hasCookies: !!cookieHeader,
    cookieKeys: Object.keys(cookies),
    hasAccessToken: !!cookies.accessToken,
    hasRefreshToken: !!cookies.refreshToken,
    hasLegacyToken: !!cookies.token
  })

  // Try access token first
  let accessToken = cookies.accessToken
  let refreshToken = cookies.refreshToken

  // Fallback to legacy token for backward compatibility
  if (!accessToken && cookies.token) {
    accessToken = cookies.token
  }

  if (!accessToken && !refreshToken) {
    console.log('❌ No tokens found, redirecting to sign-in')
    throw redirect(SIGN_IN)
  }

  // Verify access token
  if (accessToken) {
    console.log('🔍 Verifying access token...')
    const payload = verifyAccessToken(accessToken)
    console.log('🔍 Token payload:', payload ? 'Valid' : 'Invalid')

    if (payload && payload.userId) {
      const fullUser = await getUserById(payload.userId)
      const user = createSafeUser(fullUser)

      if (!user) {
        console.log('❌ User not found in database')
        throw redirect('/sign-in')
      }

      console.log('✅ User authenticated successfully:', user.email)
      return user
    } else {
      console.log('❌ Access token invalid, trying refresh token...')
    }
  }

  // If access token is invalid or missing, try refresh token
  if (refreshToken) {
    try {
      const refreshResult = await refreshSession(refreshToken)
      if (refreshResult) {
        // Set new access token cookie
        const newAccessTokenCookie = cookie.serialize('accessToken', refreshResult.accessToken, {
          httpOnly: true,
          path: '/',
          maxAge: 60 * 60, // 60 minutes
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        })

        const fullUser = await getUserById(refreshResult.userId)
        const user = createSafeUser(fullUser)

        if (!user) {
          throw redirect('/sign-in')
        }

        // Return user with new token in headers
        throw redirect(request.url, {
          headers: {
            'Set-Cookie': newAccessTokenCookie
          }
        })
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
    }
  }

  throw redirect('/sign-in')
}
