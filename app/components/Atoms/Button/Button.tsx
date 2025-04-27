import { type VariantProps } from 'class-variance-authority'
import { type ButtonHTMLAttributes, type FC, type LinkHTMLAttributes } from 'react'
import { NavLink } from 'react-router'

import { styleMerge } from '~/utils/styleUtils'

import { buttonVariants } from './button-variants'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'>,
  VariantProps<typeof buttonVariants> {
  style?: 'primary' | 'secondary' | 'danger' | null
}

interface LinkProps extends Omit<LinkHTMLAttributes<HTMLAnchorElement>, 'style'>,
  VariantProps<typeof buttonVariants> {
  style?: 'primary' | 'secondary' | 'danger' | null
  url: {
    pathname: string
    search?: string
  }
}

const Button: FC<ButtonProps> = ({ className, size, style, children, ...props }) => (
  <button
    className={styleMerge(buttonVariants({ className, size, style }))}
    data-cy="button"
    {...props}
  >
    {children}
  </button>
)

const VooDooLink: FC<LinkProps> = ({
  className, size, style, children, url, ...props }) => (
  <NavLink
    to={url}
    prefetch="intent"
    className={styleMerge(buttonVariants({ className, size, style }))}
    {...props}
  >
    {children}
  </NavLink>
)
export { Button, VooDooLink }
