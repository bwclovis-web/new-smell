import { cva, type VariantProps } from 'class-variance-authority'

export type SearchBarVariants = VariantProps<typeof searchbarVariants>
export const searchbarVariants = cva([
  'w-full bg-noir-black/90  px-2 transition-all duration-300',
  'border border-noir-gold py-2 md:py-5 md:text-xl font-semibold outline-[0]',
  'focus:outline-[4000px] focus:outline-noir-gold/90 focus:bg-noir-dark',
], {
  compoundVariants: [{}],
  defaultVariants: {
    variant: 'default'
  },
  variants: {
    variant: {
      default: 'rounded-sm',
      flat: 'rounded-tr-sm rounded-br-sm',
    }
  }
})

