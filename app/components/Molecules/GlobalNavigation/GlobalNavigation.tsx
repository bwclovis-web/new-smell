import { type VariantProps } from 'class-variance-authority'
import { type FC, type HTMLProps, useEffect, useState } from 'react'
import { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { FaUser } from "react-icons/fa6"
import { NavLink } from 'react-router'

import { mainNavigation } from '~/data/navigation'
import { ROUTE_PATH as ADMIN_PATH } from '~/routes/admin/profilePage'
import { ROUTE_PATH as SIGN_IN } from '~/routes/login/SignInPage'
import { styleMerge } from '~/utils/styleUtils'

import LogoutButton from '../LogoutButton/LogoutButton'
import { globalNavigationVariants } from './globalNavigation-variants'

interface GlobalNavigationProps extends HTMLProps<HTMLDivElement>,
  VariantProps<typeof globalNavigationVariants> {
  user?: {
    id?: string
    role?: string
  } | null
}

const GlobalNavigationContent: FC<GlobalNavigationProps> = ({ className, user }) => {
  const { t, ready } = useTranslation()
  const [isClientReady, setIsClientReady] = useState(false)

  // Ensure client-side hydration consistency
  useEffect(() => {
    setIsClientReady(true)
  }, [])
  const logoText = ready && isClientReady ? t('navigation.logo') : ' Shadow and Sillage'

  return (
    <header className='fixed z-30  w-full h-auto bg-noir-dark/60 backdrop-blur-md'>
      <nav className="flex justify-between inner-container py-5" data-cy="GlobalNavigation">
        <NavLink to="/" className="text-noir-gold hover:text-noir-light font-semibold text-lg  px-2 py-1 border border-transparent transition-colors duration-400">
          {logoText}
        </NavLink>
        <ul className="flex gap-4 items-center tracking-wide max-w-max">
          {mainNavigation.map(item => (
            <li key={item.id}>
              <NavLink
                viewTransition
                to={item.path}
                className={({ isActive }) => styleMerge(
                  'text-noir-gold hover:text-noir-light font-semibold text-lg  px-2 py-1 border border-transparent transition-colors duration-400',
                  isActive && isClientReady && 'text-noir-light bg-noir-black/30 rounded-full border-noir-light/90',
                )}
              >
                {ready && isClientReady ? t('navigation.' + item.key) : item.label}
              </NavLink>
            </li>
          ))}
          {user && (
            <li>
              <NavLink
                viewTransition
                to={ADMIN_PATH}
                className={({ isActive }) => styleMerge(
                  'text-noir-gold hover:text-noir-light font-semibold text-lg  px-2 py-1 border border-transparent transition-colors duration-400',
                  isActive && isClientReady && 'text-noir-light bg-noir-gold rounded-full border-noir-light/90',
                )}
              >
                {ready && isClientReady ? t('navigation.admin') : 'Admin'}
              </NavLink>
            </li>
          )}
          <li>
            {!user
              ? (
                <NavLink
                  viewTransition
                  to={SIGN_IN}
                  className={({ isActive }) => styleMerge(
                    'text-noir-gold hover:text-noir-light dark:text-noir-light/70 dark:hover:text-noir-light font-semibold text-lg  px-2 py-1 border border-transparent transition-colors duration-400 flex',
                    isActive && isClientReady && 'text-noir-light bg-noir-black/30 rounded-full border-noir-light/90',
                  )}
                >
                  <FaUser size={24} title="Sign In" />
                </NavLink>
              )
              : <LogoutButton />}
          </li>
        </ul>
      </nav>
    </header>
  )
}

const GlobalNavigation: FC<GlobalNavigationProps> = props => (
  <Suspense fallback={<div>Loading...</div>}>
    <GlobalNavigationContent {...props} />
  </Suspense>
)

export default GlobalNavigation
