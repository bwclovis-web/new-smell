import { cva, type VariantProps } from 'class-variance-authority'

export type SearchBarVariants = VariantProps<typeof searchbarVariants>
export const searchbarVariants = cva(['w-full rounded-sm px-2 border border-noir-dark py-2.5 outline-[0] focus:outline-[2000px] focus:outline-noir-gold/80 transition-all duration-300 focus:bg-white/50 dark:border-noir-light dark:bg-noir-gray/40 dark:text-noir-white/30 dark:focus:bg-noir-gray/50 dark:focus:ring-offset-noir-gray dark:focus:outline-noir-dark/80'], {
  compoundVariants: [{}],
  defaultVariants: {},
  variants: {}
})
