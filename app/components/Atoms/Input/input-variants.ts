import { cva, type VariantProps } from 'class-variance-authority'

export type InputVariants = VariantProps<typeof inputVariants>
export const inputVariants = cva(['w-full '], {
  compoundVariants: [{}],
  defaultVariants: {},
  variants: {}
})
