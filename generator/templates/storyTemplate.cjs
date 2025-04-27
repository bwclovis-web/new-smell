function generateStoryTemplate(componentName, componentType) {
  return `import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import ${componentName} from '~/components/${componentType}/${componentName}/${componentName}'

const meta = {
  argTypes: {},
  args: { onClick: fn() },
  component: ${componentName},
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  title: '${componentType}/${componentName}'
} satisfies Meta<typeof ${componentName}>
  
export default meta
type Story = StoryObj<typeof meta>
// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {}
`
}
module.exports = generateStoryTemplate
