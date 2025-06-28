import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import Checkbox from '~/components/Atoms/Checkbox/Checkbox'

const meta = {
  argTypes: {},
  args: { onClick: fn() },
  component: Checkbox,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  title: 'Atoms/Checkbox'
} satisfies Meta<typeof Checkbox>
  
export default meta
type Story = StoryObj<typeof meta>
// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {}
