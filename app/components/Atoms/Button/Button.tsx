import { type VariantProps } from 'class-variance-authority'
import { type ButtonHTMLAttributes, type FC, type LinkHTMLAttributes, type Ref } from 'react'
import { NavLink } from 'react-router'

import { styleMerge } from '~/utils/styleUtils'

import { buttonVariants } from './button-variants'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'>,
  VariantProps<typeof buttonVariants> {
  style?: 'primary' | 'secondary' | 'danger' | null
  ref: Ref<HTMLAnchorElement>
}

interface LinkProps extends Omit<LinkHTMLAttributes<HTMLAnchorElement>, 'style'>,
  VariantProps<typeof buttonVariants> {
  style?: 'primary' | 'secondary' | 'danger' | 'link' | null
  url: string
  ref: Ref<HTMLAnchorElement>
}

const Button: FC<ButtonProps> = ({ className, size, style, children, type = 'button', ref, ...props }) => (
  <button
    className={styleMerge(buttonVariants({ className, size, style }))}
    data-cy="button"
    type={type}
    ref={ref}
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
