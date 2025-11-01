import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"

import RangeSlider from "~/components/Atoms/RangeSlider/RangeSlider"

const meta = {
  argTypes: {},
  args: { onClick: fn() },
  component: RangeSlider,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "Atoms/RangeSlider",
} satisfies Meta<typeof RangeSlider>

export default meta
type Story = StoryObj<typeof meta>
// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {}
