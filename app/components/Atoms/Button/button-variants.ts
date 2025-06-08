import { cva, type VariantProps } from 'class-variance-authority'

export type ButtonVariants = VariantProps<typeof buttonVariants>

export const buttonVariants = cva(['rounded-sm cursor-pointer '], {
  compoundVariants: [{}],
  defaultVariants: {
    size: 'md',
    style: 'primary'
  },
  variants: {
    size: {
      sm: 'text-sm px-0.75 py-1',
      md: 'text-lg px-2 py-3',
      lg: 'text-lg px-3 py-3.5'
    },
    style: {
      primary: 'bg-noir-gold border-2 border-noir-gray text-amber-50',
      secondary: 'bg-btn-secondary hover:bg-btn-secondary-hover focus:bg-btn-secondary-focus disabled:bg-btn-secondary-disabled text-white',
      danger: 'bg-btn-danger hover:bg-btn-danger-hover focus:bg-btn-danger-focus disabled:bg-btn-danger-disabled text-white',
      link: 'bg-transparent text-blue-200 font-semibold hover:underline focus:bg-noir-gold/20 disabled:bg-transparent text-nowrap px-0'
    }
  }
})
