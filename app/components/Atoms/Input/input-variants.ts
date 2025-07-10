import { cva, type VariantProps } from 'class-variance-authority'

export type InputVariants = VariantProps<typeof inputVariants>
export const inputWrapperVariants = cva(['w-full '], {
  compoundVariants: [{}],
  defaultVariants: {},
  variants: {}
})

export const inputVariants = cva(['w-full rounded-sm border border-gray-500 px-2 py-1 text-lg mt-1 transition-all focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-noir-gold focus:border-transparent focus:ring-offset-2 dark:border-noir-light dark:text-white dark:focus:bg-noir-gray/20 dark:focus:ring-offset-noir-gray'], {
  compoundVariants: [{}],
  defaultVariants: {},
  variants: {
    shading: {
      true: 'bg-noir-gray/20 dark:bg-noir-gray/40',
      false: 'bg-noir-gray/10 dark:bg-noir-gray/30'
    }
  }
})
