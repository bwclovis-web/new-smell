import { cva, type VariantProps } from 'class-variance-authority'

export type GlobalNavigationVariants = VariantProps<typeof globalNavigationVariants>
export const globalNavigationVariants = cva(['bg-noir-dark/90 backdrop-blur-lg sticky z-30 top-0 w-full py-5 px-8 mt-6 rounded flex justify-between items-center'], {
  compoundVariants: [{}],
  defaultVariants: {},
  variants: {}
})
