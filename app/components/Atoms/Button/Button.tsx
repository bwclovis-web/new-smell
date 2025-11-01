import { type VariantProps } from 'class-variance-authority'
import { type ButtonHTMLAttributes, type LinkHTMLAttributes, type Ref } from 'react'
import { NavLink } from 'react-router'

import { styleMerge } from '~/utils/styleUtils'

import { buttonVariants } from './button-variants'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'>,
  VariantProps<typeof buttonVariants> {
  variant?: 'primary' | 'secondary' | 'danger' | 'icon' | null
  ref?: Ref<HTMLButtonElement>
}

interface LinkProps extends Omit<LinkHTMLAttributes<HTMLAnchorElement>, 'style'>,
  VariantProps<typeof buttonVariants> {
  variant?: 'primary' | 'secondary' | 'danger' | 'link' | 'icon' | null
  url: string
  ref?: Ref<HTMLAnchorElement>
  background?: 'red' | 'gold' | null
}

const Button = ({ className, size, variant, children, background, type = 'button', ref, ...props }: ButtonProps) => (
  <button
    className={styleMerge(buttonVariants({ className, size, variant, background }))}
    data-cy="button"
    type={type}
    ref={ref}
    {...props}
  >
    {children}
  </button>
)

const VooDooLink = ({
  className, size, variant, children, url, background, ...props }: LinkProps) => (
  <NavLink
    to={url}
    viewTransition
    prefetch="intent"
    className={styleMerge(buttonVariants({ className, size, variant, background }))}
    {...props}
  >
    {children}
  </NavLink>
)
export { Button, VooDooLink }
