import { cva, type VariantProps } from 'class-variance-authority'

export type GlobalNavigationVariants = VariantProps<typeof globalNavigationVariants>
export const globalNavigationVariants = cva(['flex sticky gap-3 bg-noir-gold/20 dark:bg-noir-dark/30 backdrop-blur-md z-50 top-0 w-full py-5 px-8 mt-6 rounded flex-col md:flex-row justify-items-center md:justify-items-start md:justify-between items-center'], {
  compoundVariants: [{}],
  defaultVariants: {},
  variants: {}
})
