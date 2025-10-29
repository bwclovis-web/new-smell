/* eslint-disable max-statements */
import cookie from 'cookie'
import { redirect } from 'react-router'

import { getUserById } from '~/models/user.query'
import { ROUTE_PATH as SIGN_IN } from '~/routes/login/SignInPage'
import { createSafeUser } from '~/types'
import { refreshAccessToken, verifyAccessToken } from '~/utils/security/session-manager.server'

export const sharedLoader = async (request: Request) => {
  const cookieHeader = request.headers.get('cookie') || ''

  // Parse cookies correctly
  const cookies = cookie.parse(cookieHeader)


  // Try access token first
  let accessToken = cookies.accessToken
  let refreshToken = cookies.refreshToken

  // Fallback to legacy token for backward compatibility
  if (!accessToken && cookies.token) {
    accessToken = cookies.token
  }

  if (!accessToken && !refreshToken) {
    throw redirect(SIGN_IN)
  }

  // Verify access token
  if (accessToken) {
    const payload = verifyAccessToken(accessToken)

    if (payload && payload.userId) {
      const fullUser = await getUserById(payload.userId)
      const user = createSafeUser(fullUser)

      if (!user) {
        throw redirect('/sign-in')
      }

      return user
    }
  }

  // If access token is invalid or missing, try refresh token
  if (refreshToken) {
    try {
      const refreshResult = await refreshAccessToken(refreshToken)
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
      // Token refresh failed
    }
  }

  throw redirect('/sign-in')
}
