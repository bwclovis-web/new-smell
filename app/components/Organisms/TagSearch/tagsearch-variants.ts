import { cva, type VariantProps } from 'class-variance-authority'

export type TagSearchVariants = VariantProps<typeof tagSearchVariants>
export const tagSearchVariants = cva(['flex flex-col gap-2 relative h-40'], {
  compoundVariants: [{}],
  defaultVariants: {},
  variants: {}
})
