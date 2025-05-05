import { cva, type VariantProps } from 'class-variance-authority'

export type SearchBarVariants = VariantProps<typeof searchbarVariants>
export const searchbarVariants = cva([""], {
  compoundVariants: [{}],
  defaultVariants: {},
  variants: {}
})
