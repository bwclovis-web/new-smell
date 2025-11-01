import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"

import Modal from "~/components/Organisms/Modal/Modal"

const meta = {
  argTypes: {},
  args: { onClick: fn() },
  component: Modal,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "Organisms/Modal",
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>
// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {}
