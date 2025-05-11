import { cva, type VariantProps } from 'class-variance-authority'

export type SearchBarVariants = VariantProps<typeof searchbarVariants>
export const searchbarVariants = cva(['w-full rounded-sm px-2 border border-noir-gold py-2.5 outline-[0] focus:outline-[2000px] focus:outline-noir-gold/80 transition-all duration-300 focus:bg-white/50'], {
  compoundVariants: [{}],
  defaultVariants: {},
  variants: {}
})
