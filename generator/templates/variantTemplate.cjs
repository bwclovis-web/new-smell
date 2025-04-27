function generateVariantTemplate(componentName) {
  const lowerComponentName = componentName.toLocaleLowerCase()

  return `import { cva, type VariantProps } from 'class-variance-authority'

export type ${componentName}Variants = VariantProps<typeof ${lowerComponentName}Variants>
export const ${lowerComponentName}Variants = cva([""], {
  compoundVariants: [{}],
  defaultVariants: {},
  variants: {}
})
`
}
module.exports = generateVariantTemplate
