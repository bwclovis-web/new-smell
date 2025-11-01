import { cva, type VariantProps } from "class-variance-authority"

export type AdminNavigationVariants = VariantProps<typeof adminNavigationVariants>
export const adminNavigationVariants = cva(
  ["py-2 rounded-sm noir-border min-h-max h-full w-full bg-noir-black/80 backdrop-blur-sm",],
  {
    compoundVariants: [{}],
    defaultVariants: {},
    variants: {},
  }
)
