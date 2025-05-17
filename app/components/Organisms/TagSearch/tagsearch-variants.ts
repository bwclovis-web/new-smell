import { cva, type VariantProps } from 'class-variance-authority'

export type TagSearchVariants = VariantProps<typeof tagSearchVariants>
export const tagSearchVariants = cva([''], {
  compoundVariants: [{}],
  defaultVariants: {},
  variants: {}
})
