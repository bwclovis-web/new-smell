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
}

const AdminNavigation = ({ className, user }: AdminNavigationProps) => {
  const { t } = useTranslation()
  return (
    <aside className="relative md:fixed top-40 md:right-20 z-20 w-full md:w-64  text-noir-light py-4">
      <ul
        className={styleMerge(adminNavigationVariants({ className }))}
        data-cy="AdminNavigation"
      >
        {(user?.role === "admin" || user?.role === "editor") &&
          adminNavigation.map(item => (
            <li
              key={item.id}
              className="capitalize font-semibold text-shadow-sm text-shadow-noir-dark/70"
            >
              <NavLink
                viewTransition
                to={item.path}
                suppressHydrationWarning
                className={({ isActive }) => styleMerge(
                    "text-noir-gold py-2  hover:text-noir-gold-500 transition-colors duration-200 hover:bg-noir-dark/80 block w-full",
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
        {profileNavigation.map(item => (
          <li
            key={item.id}
            className="capitalize font-semibold text-shadow-sm text-shadow-noir-dark/70"
          >
            <NavLink
              viewTransition
              to={item.path}
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
        <li>
          <LanguageSwitcher />
        </li>
      </ul>
    </aside>
  )
}
export default AdminNavigation
