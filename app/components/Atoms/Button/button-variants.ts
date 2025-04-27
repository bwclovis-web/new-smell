import { cva, type VariantProps } from 'class-variance-authority'

export type ButtonVariants = VariantProps<typeof buttonVariants>

export const buttonVariants = cva(['rounded-sm cursor-pointer'], {
  compoundVariants: [{}],
  defaultVariants: {
    size: 'lg',
    style: 'danger'
  },
  variants: {
    size: {
      sm: 'text-sm px-0.75 py-1',
      md: 'text-base px-2 py-3',
      lg: 'text-lg px-3 py-3.5'
    },
    style: {
      primary: 'bg-btn-primary hover:bg-btn-primary-hover focus:bg-btn-primary-focus disabled:bg-btn-primary-disabled text-white',
      secondary: 'bg-btn-secondary hover:bg-btn-secondary-hover focus:bg-btn-secondary-focus disabled:bg-btn-secondary-disabled text-white',
      danger: 'bg-btn-danger hover:bg-btn-danger-hover focus:bg-btn-danger-focus disabled:bg-btn-danger-disabled text-white'
    }
  }
})
