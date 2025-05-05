import { cva, type VariantProps } from 'class-variance-authority'

export type RadioSelectVariants = VariantProps<typeof radioSelectVariants>
export const radioSelectVariants = cva([''], {
  compoundVariants: [{}],
  defaultVariants: {},
  variants: {}
})
