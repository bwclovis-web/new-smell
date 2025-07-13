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
  <aside className='fixed top-20 left-0 z-20 w-full md:w-64  text-noir-light py-4'>
    <ul
      className={styleMerge(adminNavigationVariants({ className }))}
      data-cy="AdminNavigation"
    >
      {user.role === 'admin' && adminNavigation.map(item => (
        <li key={item.id} className="capitalize font-semibold text-shadow-sm text-shadow-noir-dark/70">
          <NavLink
            viewTransition
            to={item.path}
            suppressHydrationWarning
            className={({ isActive }) => styleMerge(
              'text-noir-gold py-2  hover:text-noir-gold-500 transition-colors duration-200 hover:bg-noir-dark/80 block w-full',
              isActive ? 'text-noir-dark text-shadow-none  bg-noir-gold/80 border-2 border-noir-gold' : ''
            )}
          >
            <span className='pl-2'>{item.label}</span>
          </NavLink>
        </li>
      ))}
      {profileNavigation.map(item => (
        <li key={item.id} className="capitalize font-semibold text-shadow-sm text-shadow-noir-dark/70">
          <NavLink
            viewTransition
            to={item.path}
            suppressHydrationWarning
            className={({ isActive }) => styleMerge(
              'text-noir-gold py-2  hover:text-noir-gold-500 transition-colors duration-200 hover:bg-noir-dark/80 block w-full',
              isActive ? 'text-noir-dark text-shadow-none  bg-noir-gold/80 border-2 border-noir-gold' : ''
            )}
          >
            <span className='pl-2'>{item.label}</span>
          </NavLink>
        </li>
      ))}
      <li>
        <LanguageSwitcher />
      </li>
    </ul>
  </aside>
)
export default AdminNavigation
