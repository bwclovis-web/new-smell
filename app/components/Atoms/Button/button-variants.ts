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
      lg: 'text-lg px-3 py-3.5',
      xl: 'text-2xl px-2 py-2'
    },
    variant: {
      primary: 'bg-noir-blue border-2 border-noir-gold text-noir-light font-semibold tracking-wide',
      secondary: 'bg-btn-secondary hover:bg-btn-secondary-hover focus:bg-btn-secondary-focus disabled:bg-btn-secondary-disabled text-white',
      danger: 'bg-btn-danger hover:bg-btn-danger-hover focus:bg-btn-danger-focus disabled:bg-btn-danger-disabled text-white',
      link: 'bg-transparent text-blue-200 font-semibold hover:underline focus:bg-noir-gold/20 disabled:bg-transparent text-nowrap px-0',
      icon: 'block bg-transparent rounded-sm p-2.5 transition-all duration-300 ease-in-out  disabled:bg-transparent font-medium border gap-3',
    },
    background: {
      red: 'bg-red-600 hover:bg-red-700 focus:bg-red-800 disabled:bg-red-400 text-white',
      gold: 'border w-full text-shadow-md text-shadow-noir-dark/60 border-noir-gold bg-noir-gold/10 text-noir-gold-100 hover:border-noir-gold-500 hover:text-noir-gold-500 hover:bg-noir-gold-500/20  focus:bg-noir-gold/20 transition-all duration-300 ease-in-out gap-4'
    }
  }
})
