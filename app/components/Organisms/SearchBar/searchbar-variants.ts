import { cva, type VariantProps } from 'class-variance-authority'

export type SearchBarVariants = VariantProps<typeof searchbarVariants>
export const searchbarVariants = cva(['w-full bg-red-500 rounded-sm px-2 py-2.5'], {
  compoundVariants: [{}],
  defaultVariants: {},
  variants: {}
})
