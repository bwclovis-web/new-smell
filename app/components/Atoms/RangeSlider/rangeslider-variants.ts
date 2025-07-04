import { cva, type VariantProps } from 'class-variance-authority'

export type RangeSliderVariants = VariantProps<typeof rangesliderVariants>
export const rangesliderVariants = cva([
  "relative",
  "w-full",
  "select-none"
], {
  compoundVariants: [{}],
  defaultVariants: {
    size: "medium"
  },
  variants: {
    size: {
      small: "h-4",
      medium: "h-6",
      large: "h-8"
    }
  }
})
