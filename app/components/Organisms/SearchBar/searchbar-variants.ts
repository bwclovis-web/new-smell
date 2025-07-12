import { cva, type VariantProps } from 'class-variance-authority'

export type SearchBarVariants = VariantProps<typeof searchbarVariants>
export const searchbarVariants = cva([
  'w-full bg-noir-black/90 rounded-sm px-2 transition-all duration-300',
  'border border-noir-gold py-5 text-xl font-semibold outline-[0]',
  'focus:outline-[2000px] focus:outline-noir-gold/90 focus:bg-noir-dark'
], {
  compoundVariants: [{}],
  defaultVariants: {},
  variants: {}
})
