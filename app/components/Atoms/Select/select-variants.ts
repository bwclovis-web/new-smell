import { cva, type VariantProps } from 'class-variance-authority'

export type SelectVariants = VariantProps<typeof selectVariants>
export const selectVariants = cva([""], {
  compoundVariants: [{}],
  defaultVariants: {},
  variants: {}
})
