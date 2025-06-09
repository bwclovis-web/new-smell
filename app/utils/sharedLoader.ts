/* eslint-disable max-statements */
import { parseCookies, verifyJwt } from '@api/utils'
import { redirect } from 'react-router'

import { getUserById } from '~/models/user.server'
import { ROUTE_PATH as SIGN_IN } from '~/routes/login/SignInPage'
import { createSafeUser } from '~/types'

export const sharedLoader = async (request: Request) => {
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = parseCookies({ headers: { cookie: cookieHeader } })

  if (!cookies.token) {
    throw redirect(SIGN_IN)
  }

  const payload = verifyJwt(cookies.token)
  if (!payload || !payload.userId) {
    throw redirect('/sign-in')
  }

  const fullUser = await getUserById(payload.userId)
  const user = createSafeUser(fullUser)

  if (!user) {
    throw redirect('/sign-in')
  }

  return user
}
