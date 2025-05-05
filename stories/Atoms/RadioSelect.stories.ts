import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import RadioSelect from '~/components/Atoms/RadioSelect/RadioSelect'

const meta = {
  argTypes: {},
  args: { onClick: fn() },
  component: RadioSelect,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  title: 'Atoms/RadioSelect'
} satisfies Meta<typeof RadioSelect>
  
export default meta
type Story = StoryObj<typeof meta>
// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {}
