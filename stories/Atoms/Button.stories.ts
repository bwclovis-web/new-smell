import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import Button from '~/components/Atoms/Button/Button'

const meta = {
  argTypes: {},
  args: { onClick: fn() },
  component: Button,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  title: 'Atoms/Button'
} satisfies Meta<typeof Button>
  
export default meta
type Story = StoryObj<typeof meta>
// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {}
