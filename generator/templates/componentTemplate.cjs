// Purpose: Generates a template for a new component.
function generateComponentTemplate(componentName) {
  const lowerComponentName = componentName.toLocaleLowerCase()

  return `import { type VariantProps } from "class-variance-authority"
import { type FC, type HTMLProps } from "react"

import { styleMerge } from "~/utils/styleUtils"

import { ${lowerComponentName}Variants } from "./${lowerComponentName}-variants"

interface ${componentName}Props extends HTMLProps<HTMLDivElement>,
  VariantProps<typeof ${lowerComponentName}Variants> { }

const ${componentName}:FC <${componentName}Props> = ({ className, ...props }) => (
  <div
    className={
      styleMerge(${lowerComponentName}Variants({ className }))
    }
    data-cy="${componentName}"
    {...props}
  >
    ${componentName}
  </div>
)
export default ${componentName}  
`
}
module.exports = generateComponentTemplate
