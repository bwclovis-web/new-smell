import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import GlobalNavigation from '~/components/Molecules/GlobalNavigation/GlobalNavigation'

const meta = {
  argTypes: {},
  args: { onClick: fn() },
  component: GlobalNavigation,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  title: 'Molecules/GlobalNavigation'
} satisfies Meta<typeof GlobalNavigation>
  
export default meta
type Story = StoryObj<typeof meta>
// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {}
