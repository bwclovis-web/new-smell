import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'

import { VooDooLink } from '~/components/Atoms/Button/Button'
import banner from '~/images/login.webp'

import { ROUTE_PATH as SIGN_UP_PATH } from './SignUpPage'
const RootLayout = () => {
  const container = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()
  // useGSAP(
  //   () => {
  //     gsap.to('.content', {
  //       duration: 0.5, ease: 'power2.inOut', opacity: 1, y: 140
  //     })
  //     gsap.to('.form', {
  //       duration: 0.5, ease: 'power2.inOut', opacity: 1
  //     })
  //   },
  //   { scope: container }
  // )
  return (
    <div className="position-relative flex flex-col gap-8 items-center h-full px-4 relative min-h-screen" ref={container}>
      <img src={banner} alt="" className="absolute object-cover w-full h-full lg:h-3/4 rounded-md border-10 border-amber-50 shadow-sm" />
      <div className="relative w-full flex flex-col lg:flex-row items-start justify-between gap-8 md:gap-16 lg:gap-24 mx-auto pt-20 md:pt-32">
        <div className="mx-auto min-w-1/3 border border-noir-gold py-5 px-3 rounded-md bg-noir-dark/60 backdrop-blur-sm shadow-md text-gray-100 content">
          <h1 className="text-xl font-bold text-shadow-lg text-shadow-black">{t('auth.heading')}</h1>
          <p className="text-lg">{t('auth.subheading')} <VooDooLink
            variant="link"
            url={SIGN_UP_PATH}
          >{t('auth.createAccount')}</VooDooLink></p>
        </div>
        <div className="w-full lg:w-1/2 form ">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default RootLayout
