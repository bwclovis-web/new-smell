import { useLoaderData } from 'react-router'
import { useTranslation } from 'react-i18next'

import { getUserById } from '~/models/user.server'
import { createSafeUser } from '~/types'
import { parseCookies, verifyJwt } from '@api/utils'

export const loader = async ({ request }: { request: Request }) => {
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = parseCookies({ headers: { cookie: cookieHeader } })

  if (!cookies.token) {
    return { user: null }
  }

  const payload = verifyJwt(cookies.token)
  if (!payload || !payload.userId) {
    return { user: null }
  }

  const fullUser = await getUserById(payload.userId)
  return { user: createSafeUser(fullUser) }
}

const CustomLandingPage = () => {
  const { t } = useTranslation()
  const { user } = useLoaderData<typeof loader>()

  if (!user) {
    return <div>{t('customLanding.guestMessage', 'Welcome, Guest!')}</div>
  }

  return (
    <div className="bg-noir-light/40 backdrop-blur-sm rounded-md shadow-md p-6 border border-noir-dark">
      <h1 className="text-2xl font-bold mb-4">{t('customLanding.title', 'Welcome Back!')}</h1>
      <p>{t('customLanding.message', 'Hello')} {user.name || user.email}!</p>
    </div>
  )
}

export default CustomLandingPage
