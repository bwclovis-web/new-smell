import { type VariantProps } from 'class-variance-authority'
import { type FC, type HTMLProps } from 'react'
import { NavLink } from 'react-router'

import LanguageSwitcher from '~/components/langSwitch'
import { adminNavigation, profileNavigation } from '~/data/navigation'
import { styleMerge } from '~/utils/styleUtils'

import { adminNavigationVariants } from './adminNavigation-variants'

interface AdminNavigationProps extends HTMLProps<HTMLUListElement>,
  VariantProps<typeof adminNavigationVariants> { }

const AdminNavigation: FC<AdminNavigationProps> = ({ className, user }) => (
  <>
    <ul
      className={styleMerge(adminNavigationVariants({ className }))}
      data-cy="AdminNavigation"
    >
      {user.role === 'admin' && adminNavigation.map(item => (
        <li key={item.id} className="py-2">
          <NavLink
            viewTransition
            to={item.path}
            suppressHydrationWarning
            className={({ isActive }) => styleMerge(
              'text-noir-light hover:text-noir-dark transition-colors duration-200 hover:bg-noir-light p-1 rounded-sm',
              isActive ? 'text-noir-light  bg-noir-gold/80 border-2 border-noir-gold' : ''
            )}
          >
            {item.label}
          </NavLink>
        </li>
      ))}
      {profileNavigation.map(item => (
        <li key={item.id} className="py-2">
          <NavLink
            viewTransition
            to={item.path}
            suppressHydrationWarning
            className={({ isActive }) => styleMerge(
              'text-noir-light hover:text-noir-dark transition-colors duration-200 hover:bg-noir-light p-1 rounded-sm',
              isActive ? 'text-noir-light  bg-noir-gold/80 border-2 border-noir-gold' : ''
            )}
          >
            {item.label}
          </NavLink>
        </li>
      ))}
      <li>
        <LanguageSwitcher />
      </li>
    </ul>
  </>
)
export default AdminNavigation
