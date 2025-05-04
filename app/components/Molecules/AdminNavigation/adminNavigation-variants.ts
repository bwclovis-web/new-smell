import { cva, type VariantProps } from 'class-variance-authority'

export type AdminNavigationVariants = VariantProps<typeof adminNavigationVariants>
export const adminNavigationVariants = cva(['bg-white/30 px-8 py-4 rounded-sm border border-white/60 min-h-max'], {
  compoundVariants: [{}],
  defaultVariants: {},
  variants: {}
})
