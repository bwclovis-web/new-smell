import { cva, type VariantProps } from 'class-variance-authority'

export type ButtonVariants = VariantProps<typeof buttonVariants>

export const buttonVariants = cva(['rounded-sm cursor-pointer '], {
  compoundVariants: [{}],
  defaultVariants: {
    size: 'md',
    variant: 'primary'
  },
  variants: {
    size: {
      sm: 'text-sm px-0.75 py-1',
      md: 'text-lg px-2 py-2',
      lg: 'text-lg px-3 py-3.5'
    },
    variant: {
      primary: 'bg-noir-blue border-2 border-noir-gold text-noir-light font-semibold tracking-wide',
      secondary: 'bg-btn-secondary hover:bg-btn-secondary-hover focus:bg-btn-secondary-focus disabled:bg-btn-secondary-disabled text-white',
      danger: 'bg-btn-danger hover:bg-btn-danger-hover focus:bg-btn-danger-focus disabled:bg-btn-danger-disabled text-white',
      link: 'bg-transparent text-blue-200 font-semibold hover:underline focus:bg-noir-gold/20 disabled:bg-transparent text-nowrap px-0',
      icon: 'bg-transparent rounded-full p-2.5 transition-all duration-300 ease-in-out hover:bg-noir-gold/20 focus:bg-noir-gold/20 disabled:bg-transparent cursor-pointer border max-w-max items-center justify-center flex items-center justify-center gap-3',
    },
    background: {
      red: 'bg-red-600 hover:bg-red-700 focus:bg-red-800 disabled:bg-red-400 text-white',
    }
  }
})
