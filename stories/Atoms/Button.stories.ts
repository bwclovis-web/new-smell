/**
 * Button component stories for Storybook
 */

import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "~/components/Atoms/Button/Button"

const meta: Meta<typeof Button> = {
  title: "Atoms/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "A reusable button component with multiple variants and states.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "danger", "ghost"],
      description: "Button variant style",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Button size",
    },
    disabled: {
      control: "boolean",
      description: "Whether the button is disabled",
    },
    loading: {
      control: "boolean",
      description: "Whether the button is in loading state",
    },
    type: {
      control: "select",
      options: ["button", "submit", "reset"],
      description: "HTML button type",
    },
    onClick: {
      action: "clicked",
      description: "Click handler function",
    },
  },
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof meta>

// Primary button stories
export const Primary: Story = {
  args: {
    children: "Primary Button",
    variant: "primary",
    size: "md",
  },
}

export const PrimarySmall: Story = {
  args: {
    children: "Primary Small",
    variant: "primary",
    size: "sm",
  },
}

export const PrimaryLarge: Story = {
  args: {
    children: "Primary Large",
    variant: "primary",
    size: "lg",
  },
}

// Secondary button stories
export const Secondary: Story = {
  args: {
    children: "Secondary Button",
    variant: "secondary",
    size: "md",
  },
}

export const SecondarySmall: Story = {
  args: {
    children: "Secondary Small",
    variant: "secondary",
    size: "sm",
  },
}

export const SecondaryLarge: Story = {
  args: {
    children: "Secondary Large",
    variant: "secondary",
    size: "lg",
  },
}

// Danger button stories
export const Danger: Story = {
  args: {
    children: "Danger Button",
    variant: "danger",
    size: "md",
  },
}

export const DangerSmall: Story = {
  args: {
    children: "Danger Small",
    variant: "danger",
    size: "sm",
  },
}

export const DangerLarge: Story = {
  args: {
    children: "Danger Large",
    variant: "danger",
    size: "lg",
  },
}

// Ghost button stories
export const Ghost: Story = {
  args: {
    children: "Ghost Button",
    variant: "ghost",
    size: "md",
  },
}

export const GhostSmall: Story = {
  args: {
    children: "Ghost Small",
    variant: "ghost",
    size: "sm",
  },
}

export const GhostLarge: Story = {
  args: {
    children: "Ghost Large",
    variant: "ghost",
    size: "lg",
  },
}

// State stories
export const Disabled: Story = {
  args: {
    children: "Disabled Button",
    variant: "primary",
    size: "md",
    disabled: true,
  },
}

export const Loading: Story = {
  args: {
    children: "Loading Button",
    variant: "primary",
    size: "md",
    loading: true,
  },
}

export const LoadingSecondary: Story = {
  args: {
    children: "Loading Secondary",
    variant: "secondary",
    size: "md",
    loading: true,
  },
}

// Button types
export const Submit: Story = {
  args: {
    children: "Submit Button",
    variant: "primary",
    size: "md",
    type: "submit",
  },
}

export const Reset: Story = {
  args: {
    children: "Reset Button",
    variant: "secondary",
    size: "md",
    type: "reset",
  },
}

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button variant="primary" size="sm">
          {" "}
          Primary Small
        </Button>
        <Button variant="primary" size="md">
          {" "}
          Primary Medium{" "}
        </Button>
        <Button variant="primary" size="lg">
          {" "}
          Primary Large{" "}
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm">
          {" "}
          Secondary Small{" "}
        </Button>
        <Button variant="secondary" size="md">
          {" "}
          Secondary Medium{" "}
        </Button>
        <Button variant="secondary" size="lg">
          {" "}
          Secondary Large{" "}
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="danger" size="sm">
          {" "}
          Danger Small{" "}
        </Button>
        <Button variant="danger" size="md">
          {" "}
          Danger Medium{" "}
        </Button>
        <Button variant="danger" size="lg">
          {" "}
          Danger Large{" "}
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm">
          {" "}
          Ghost Small{" "}
        </Button>
        <Button variant="ghost" size="md">
          {" "}
          Ghost Medium{" "}
        </Button>
        <Button variant="ghost" size="lg">
          {" "}
          Ghost Large{" "}
        </Button>
      </div>
    </div>
  ),
}

// States showcase
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button variant="primary"> Normal </Button>
        <Button variant="primary" disabled>
          {" "}
          Disabled{" "}
        </Button>
        <Button variant="primary" loading>
          {" "}
          Loading{" "}
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary"> Normal </Button>
        <Button variant="secondary" disabled>
          {" "}
          Disabled{" "}
        </Button>
        <Button variant="secondary" loading>
          {" "}
          Loading{" "}
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="danger"> Normal </Button>
        <Button variant="danger" disabled>
          {" "}
          Disabled{" "}
        </Button>
        <Button variant="danger" loading>
          {" "}
          Loading{" "}
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost"> Normal </Button>
        <Button variant="ghost" disabled>
          {" "}
          Disabled{" "}
        </Button>
        <Button variant="ghost" loading>
          {" "}
          Loading{" "}
        </Button>
      </div>
    </div>
  ),
}
