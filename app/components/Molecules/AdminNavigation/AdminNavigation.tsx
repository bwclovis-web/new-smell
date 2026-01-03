import { type VariantProps } from "class-variance-authority"
import { type HTMLProps } from "react"
import { useTranslation } from "react-i18next"
import { NavLink } from "react-router"

import LanguageSwitcher from "~/components/Organisms/LanguageSwitcher"
import { adminNavigation, profileNavigation } from "~/data/navigation"
import { styleMerge } from "~/utils/styleUtils"

import { adminNavigationVariants } from "./adminNavigation-variants"

interface AdminNavigationProps
  extends HTMLProps<HTMLUListElement>,
    VariantProps<typeof adminNavigationVariants> {
  user?: {
    role?: string
  }
  onNavClick?: () => void
}

const AdminNavigation = ({ className, user, onNavClick }: AdminNavigationProps) => {
  const { t } = useTranslation()
  const isAdmin = user?.role === "admin" || user?.role === "editor"
  
  return (
    <nav className="z-20 w-full text-noir-light pt-4">
      <ul
        className={styleMerge(adminNavigationVariants({ className }))}
        data-cy="AdminNavigation"
      >
        {/* Admin-only navigation - only show for admins/editors */}
        {isAdmin &&
          adminNavigation.map(item => (
            <li
              key={item.id}
              className="capitalize font-semibold text-shadow-sm text-shadow-noir-dark/70 leading-5"
            >
              <NavLink
                viewTransition
                to={item.path}
                onClick={onNavClick}
                suppressHydrationWarning
                className={({ isActive }) => styleMerge(
                    "text-noir-gold py-2 px-2  hover:text-noir-gold-500 transition-colors duration-200 hover:bg-noir-dark/80 block w-full",
                    isActive
                      ? "text-noir-dark text-shadow-none  bg-noir-gold/80 border-2 border-noir-gold"
                      : ""
                  )
                }
              >
                <span className="pl-2">{t("admin.navigation." + item.key)}</span>
              </NavLink>
            </li>
          ))}
        {/* Profile navigation - show for all authenticated users */}
        {user && profileNavigation.map(item => (
          <li
            key={item.id}
            className="capitalize font-semibold text-shadow-sm text-shadow-noir-dark/70 leading-5"
          >
            <NavLink
              viewTransition
              to={item.path}
              onClick={onNavClick}
              suppressHydrationWarning
              className={({ isActive }) => styleMerge(
                  "text-noir-gold py-2  hover:text-noir-gold-500 transition-colors duration-200 hover:bg-noir-dark/80 block w-full",
                  isActive
                    ? "text-noir-dark text-shadow-none  bg-noir-gold/80 border-2 border-noir-gold"
                    : ""
                )
              }
            >
              <span className="pl-2">{t("profile.navigation." + item.key)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
export default AdminNavigation
