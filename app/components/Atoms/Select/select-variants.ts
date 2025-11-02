import { cva, type VariantProps } from "class-variance-authority"

export type SelectWrapperVariants = VariantProps<typeof selectWrapperVariants>
export type SelectVariants = VariantProps<typeof selectVariants>
export const selectWrapperVariants = cva(["flex flex-col bg-noir-black/90 border border-noir-gold pr-2 py-0 h-auto w-1/4 max-w-max"], {
  compoundVariants: [{}],
  defaultVariants: {},
  variants: {},
})

export const selectVariants = cva(
  ['cursor-pointer relative rounded-tl-sm rounded-bl-sm px-2.5 text-noir-gold'],
  {
    compoundVariants: [{}],
    defaultVariants: {},
    variants: {
      size: {
        default: "px-2.5 py-2.5 rounded-tl-sm rounded-bl-sm",
        compact: "px-1.5 py-1.5 rounded-tl-sm rounded-bl-sm",
        expanded:
          "md:px-3 md:py-5 px-2.5 rounded-tl-sm rounded-bl-sm border-r-0 font-semibold md:text-xl",
      },
    },
  }
)
