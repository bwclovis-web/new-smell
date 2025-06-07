import { cva, type VariantProps } from 'class-variance-authority'

export type GlobalNavigationVariants = VariantProps<typeof globalNavigationVariants>
export const globalNavigationVariants = cva(['bg-noir-dark/90 flex backdrop-blur-lg sticky gap-3 z-50 top-0 w-full py-5 px-8 mt-6 rounded flex-col md:flex-row justify-items-center md:justify-items-start md:justify-between items-center'], {
  compoundVariants: [{}],
  defaultVariants: {},
  variants: {}
})
