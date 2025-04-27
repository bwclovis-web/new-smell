function generateViteTestTemplate(componentName) {
  const lowerComponentName = componentName.toLocaleLowerCase()
      
return `import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ${componentName} from './${componentName}'

describe('${componentName}', () => {
  it('renders a ${lowerComponentName}', () => {
    render(<${componentName} />)
    expect(screen.getByText('${componentName}')).toBeInTheDocument()
  })
})
`
}
module.exports = generateViteTestTemplate