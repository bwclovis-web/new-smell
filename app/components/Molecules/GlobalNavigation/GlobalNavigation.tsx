import { type VariantProps } from 'class-variance-authority'
import { type FC, type HTMLProps } from 'react'
import { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'

import { mainNavigation } from '~/data/navigation'
import { styleMerge } from '~/utils/styleUtils'

import { globalNavigationVariants } from './globalNavigation-variants'

interface GlobalNavigationProps extends HTMLProps<HTMLDivElement>,
  VariantProps<typeof globalNavigationVariants> { }

const GlobalNavigationContent: FC<GlobalNavigationProps> = ({ className }) => {
  const { t } = useTranslation()

  return (
    <nav className={styleMerge(globalNavigationVariants({ className }))} data-cy="GlobalNavigation">
      <div>
        <NavLink to="/" className="text-white text-2xl font-bold">
          {t('navigation.logo')}
        </NavLink>
      </div>
      <ul className="flex gap-4">
        {mainNavigation.map(item => (
          <li key={item.id}>
            <NavLink
              viewTransition
              to={item.path}
              className={({ isActive }) => styleMerge(
                'text-white hover:text-gray-300',
                isActive ? 'text-gray-300' : ''
              )}
            >
              {t(item.key)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

const GlobalNavigation: FC<GlobalNavigationProps> = props => (
  <Suspense fallback={<div>Loading...</div>}>
    <GlobalNavigationContent {...props} />
  </Suspense>
)

export default GlobalNavigation
