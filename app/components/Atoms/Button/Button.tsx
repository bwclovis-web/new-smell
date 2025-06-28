import { type VariantProps } from 'class-variance-authority'
import { type ButtonHTMLAttributes, type FC, type LinkHTMLAttributes, type Ref } from 'react'
import { NavLink } from 'react-router-dom'

import { styleMerge } from '~/utils/styleUtils'

import { buttonVariants } from './button-variants'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'>,
  VariantProps<typeof buttonVariants> {
  variant?: 'primary' | 'secondary' | 'danger' | null
  ref?: Ref<HTMLButtonElement>
}

interface LinkProps extends Omit<LinkHTMLAttributes<HTMLAnchorElement>, 'style'>,
  VariantProps<typeof buttonVariants> {
  variant?: 'primary' | 'secondary' | 'danger' | 'link' | null
  url: string
  ref?: Ref<HTMLAnchorElement>
}

const Button: FC<ButtonProps> = ({ className, size, variant, children, type = 'button', ref, ...props }) => (
  <button
    className={styleMerge(buttonVariants({ className, size, variant }))}
    data-cy="button"
    type={type}
    ref={ref}
    {...props}
  >
    {children}
  </button>
)

const VooDooLink: FC<LinkProps> = ({
  className, size, variant, children, url, ...props }) => (
  <NavLink
    to={url}
    prefetch="intent"
    className={styleMerge(buttonVariants({ className, size, variant }))}
    {...props}
  >
    {children}
  </NavLink>
)
export { Button, VooDooLink }
