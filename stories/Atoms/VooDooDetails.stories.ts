import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"

import VooDooDetails from "~/components/Atoms/VooDooDetails/VooDooDetails"

const meta = {
  argTypes: {},
  args: { onClick: fn() },
  component: VooDooDetails,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "Atoms/VooDooDetails",
} satisfies Meta<typeof VooDooDetails>

export default meta
type Story = StoryObj<typeof meta>
// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {}
