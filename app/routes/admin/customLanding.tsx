import { redirect, useLoaderData } from 'react-router'
import { useTranslation } from 'react-i18next'
import { sharedLoader } from '~/utils/sharedLoader'

export const loader = async ({ request }: { request: Request }) => {
  const user = await sharedLoader(request)

  if (user.role !== 'admin') {
    throw redirect(`/admin/${user.id}`)
  }
  return { user }
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
