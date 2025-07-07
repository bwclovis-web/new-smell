import { useTranslation } from 'react-i18next'
import { useLoaderData } from 'react-router'

import TitleBanner from '~/components/Organisms/TitleBanner/TitleBanner'
import { sharedLoader } from '~/utils/sharedLoader'
import { getUserDisplayName } from '~/utils/user'

import banner from '../../images/home.webp'
export const ROUTE_PATH = '/admin/profile'
export const loader = async ({ request }: { request: Request }) => {
  const user = await sharedLoader(request)

  return { user }
}

const ProfilePage = () => {
  const { t } = useTranslation()
  const { user } = useLoaderData<typeof loader>()

  if (!user) {
    return <div>{t('profile.heading', 'Welcome, Guest!')}</div>
  }

  return (
    <div className="bg-noir-light/40 backdrop-blur-sm rounded-md shadow-md p-6 border border-noir-dark">
      <TitleBanner image={banner} heading={t('profile.heading')} subheading={`${getUserDisplayName(user)} ${t('profile.subheading')}`} />
    </div >
  )
}

export default ProfilePage
