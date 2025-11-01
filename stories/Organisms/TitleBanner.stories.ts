import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"

import TitleBanner from "~/components/Organisms/TitleBanner/TitleBanner"

const meta = {
  argTypes: {},
  args: { onClick: fn() },
  component: TitleBanner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "Organisms/TitleBanner",
} satisfies Meta<typeof TitleBanner>

export default meta
type Story = StoryObj<typeof meta>
// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {}
