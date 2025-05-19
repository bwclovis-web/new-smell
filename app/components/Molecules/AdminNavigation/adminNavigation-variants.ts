import { cva, type VariantProps } from 'class-variance-authority'

export type AdminNavigationVariants = VariantProps<typeof adminNavigationVariants>
export const adminNavigationVariants = cva(['bg-noir-gray px-2 py-2 rounded-sm border border-noir-gold/60 min-h-max h-full w-full md:w-1/5'], {
  compoundVariants: [{}],
  defaultVariants: {},
  variants: {}
})
