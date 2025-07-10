import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'

import { VooDooLink } from '~/components/Atoms/Button/Button'
import banner from '~/images/login.webp'

import { ROUTE_PATH as SIGN_UP_PATH } from './SignUpPage'
const RootLayout = () => {
  const container = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-start px-4 relative md:h-screen noir-outline" ref={container}>
      <img src={banner} alt="" className="absolute object-cover w-full h-full lg:h-3/4 rounded-md shadow-sm" />
      <div className="relative w-full flex flex-col lg:flex-row items-start justify-between gap-4 md:gap-16 lg:gap-24 mx-auto pt-10 md:pt-32">
        <div className="mx-auto min-w-1/3 border border-noir-gold py-5 px-3 rounded-md bg-noir-dark/60 backdrop-blur-sm shadow-md text-gray-100 content">
          <h1 className="text-xl font-bold text-shadow-lg text-shadow-black">{t('auth.heading')}</h1>
          <p className="subtitle">{t('auth.subheading')}
            <VooDooLink
              variant="link"
              size="sm"
              url={SIGN_UP_PATH}
            >{t('auth.createAccount')}</VooDooLink>
          </p>
        </div>
        <div className="w-full lg:w-1/2 form flex flex-col items-center justify-start gap-4 ">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default RootLayout
