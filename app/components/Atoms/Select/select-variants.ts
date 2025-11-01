import { cva, type VariantProps } from "class-variance-authority"

export type SelectWrapperVariants = VariantProps<typeof selectWrapperVariants>
export type SelectVariants = VariantProps<typeof selectVariants>
export const selectWrapperVariants = cva(["flex flex-col"], {
  compoundVariants: [{}],
  defaultVariants: {},
  variants: {},
})

export const selectVariants = cva(
  [
    'mt-1 cursor-pointer appearance-none relative after:absolute after:content-["😹"] rounded-tl-sm rounded-bl-sm border border-noir-gold px-2.5 h-full py-2.5 bg-noir-black/90 text-noir-gold',
  ],
  {
    compoundVariants: [{}],
    defaultVariants: {},
    variants: {
      size: {
        default: "px-2.5 py-2.5 rounded-tl-sm rounded-bl-sm",
        compact: "px-1.5 py-1.5 rounded-tl-sm rounded-bl-sm",
        expanded:
          "md:px-3 md:py-5 px-2.5 rounded-tl-sm rounded-bl-sm border-r-0 font-semibold md:text-xl after:bottom-2 after:right-2 after:text-2xl after:border-l after:pl-2",
      },
    },
  }
)
