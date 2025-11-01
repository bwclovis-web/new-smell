import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"

import TagSearch from "~/components/Organisms/TagSearch/TagSearch"

const meta = {
  argTypes: {},
  args: { onClick: fn() },
  component: TagSearch,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  title: "Organisms/TagSearch",
} satisfies Meta<typeof TagSearch>

export default meta
type Story = StoryObj<typeof meta>
// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {}
