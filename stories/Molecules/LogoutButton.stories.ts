import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"

import LogoutButton from "~/components/Molecules/LogoutButton/LogoutButton"

const meta = {
  argTypes: {},
  args: { onClick: fn() },
  component: LogoutButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "Molecules/LogoutButton",
} satisfies Meta<typeof LogoutButton>

export default meta
type Story = StoryObj<typeof meta>
// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {}
