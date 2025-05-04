import { type VariantProps } from 'class-variance-authority'
import { type FC, type HTMLProps } from 'react'
import { NavLink } from 'react-router'

import LanguageSwitcher from '~/components/langSwitch'
import { adminNavigation } from '~/data/navigation'
import { styleMerge } from '~/utils/styleUtils'

import { adminNavigationVariants } from './adminNavigation-variants'

interface AdminNavigationProps extends HTMLProps<HTMLUListElement>,
  VariantProps<typeof adminNavigationVariants> { }

const AdminNavigation: FC<AdminNavigationProps> = ({ className }) => (
  <>
    <ul
      className={styleMerge(adminNavigationVariants({ className }))}
      data-cy="AdminNavigation"
    >
      {adminNavigation.map(item => (
        <li key={item.id}>
          <NavLink
            to={item.path}
            className={({ isActive }) => styleMerge(
              'text-white hover:text-gray-300',
              isActive ? 'text-gray-300' : ''
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
