/**
 * ValidatedInput component stories for Storybook
 */

import type { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"
import { z } from "zod"
import ValidatedInput from "~/components/Atoms/ValidatedInput/ValidatedInput"

const meta: Meta<typeof ValidatedInput> = {
  title: "Atoms/ValidatedInput",
  component: ValidatedInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Input component with built-in validation and real-time feedback.",
      },
    },
  },
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "tel", "url", "number", "search"],
      description: "Input type",
    },
    validateOnChange: {
      control: "boolean",
      description: "Whether to validate on change",
    },
    validateOnBlur: {
      control: "boolean",
      description: "Whether to validate on blur",
    },
    debounceMs: {
      control: "number",
      description: "Debounce delay in milliseconds",
    },
    required: {
      control: "boolean",
      description: "Whether the input is required",
    },
    disabled: {
      control: "boolean",
      description: "Whether the input is disabled",
    },
    showValidationIcon: {
      control: "boolean",
      description: "Whether to show validation icon",
    },
  },
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof meta>

// Email validation schema
const emailSchema = z.string().email("Please enter a valid email address")

// Password validation schema
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number")
  .regex(/[^A-Za-z0-9]/, "Password must contain a special character")

// Basic text input
export const Text: Story = {
  render: (args) => {
    const [value, setValue] = useState("")
    return <ValidatedInput {...args} name="text" value={value} onChange={setValue} />
  },
  args: {
    name: "text",
    label: "Text Input",
    placeholder: "Enter text...",
    type: "text",
  },
}

// Email input with validation
export const Email: Story = {
  render: (args) => {
    const [value, setValue] = useState("")
    return (
      <ValidatedInput
        {...args}
        name="email"
        value={value}
        onChange={setValue}
        validationSchema={emailSchema}
        validateOnChange={true}
        validateOnBlur={true}
      />
    )
  },
  args: {
    name: "email",
    label: "Email Address",
    placeholder: "Enter your email...",
    type: "email",
    required: true,
    helpText: "We'll never share your email",
  },
}

// Password input with strength validation
export const Password: Story = {
  render: (args) => {
    const [value, setValue] = useState("")
    return (
      <ValidatedInput
        {...args}
        name="password"
        value={value}
        onChange={setValue}
        validationSchema={passwordSchema}
        validateOnChange={true}
        validateOnBlur={true}
      />
    )
  },
  args: {
    name: "password",
    label: "Password",
    placeholder: "Enter your password...",
    type: "password",
    required: true,
    helpText:
      "Must be at least 8 characters with uppercase, lowercase, number, and special character",
  },
}

// URL input with validation
export const URL: Story = {
  render: (args) => {
    const [value, setValue] = useState("")
    const urlSchema = z.string().url("Please enter a valid URL")
    return (
      <ValidatedInput
        {...args}
        name="url"
        value={value}
        onChange={setValue}
        validationSchema={urlSchema}
        validateOnChange={true}
        validateOnBlur={true}
      />
    )
  },
  args: {
    name: "url",
    label: "Website URL",
    placeholder: "https://example.com",
    type: "url",
    helpText: "Enter a valid website URL",
  },
}

// Number input with validation
export const Number: Story = {
  render: (args) => {
    const [value, setValue] = useState("")
    const numberSchema = z
      .string()
      .regex(/^\d+$/, "Please enter a valid number")
      .transform(Number)
      .refine((n) => n >= 0 && n <= 100, "Number must be between 0 and 100")
    return (
      <ValidatedInput
        {...args}
        name="number"
        value={value}
        onChange={setValue}
        validationSchema={numberSchema}
        validateOnChange={true}
        validateOnBlur={true}
      />
    )
  },
  args: {
    name: "number",
    label: "Age",
    placeholder: "Enter your age...",
    type: "number",
    min: 0,
    max: 100,
    helpText: "Enter your age (0-100)",
  },
}

// Search input
export const Search: Story = {
  render: (args) => {
    const [value, setValue] = useState("")
    return (
      <ValidatedInput {...args} name="search" value={value} onChange={setValue} />
    )
  },
  args: {
    name: "search",
    label: "Search",
    placeholder: "Search for perfumes...",
    type: "search",
  },
}

// Disabled state
export const Disabled: Story = {
  render: (args) => {
    const [value, setValue] = useState("Disabled input")
    return (
      <ValidatedInput {...args} name="disabled" value={value} onChange={setValue} />
    )
  },
  args: {
    name: "disabled",
    label: "Disabled Input",
    placeholder: "This input is disabled",
    type: "text",
    disabled: true,
  },
}

// With error state
export const WithError: Story = {
  render: (args) => {
    const [value, setValue] = useState("invalid-email")
    return (
      <ValidatedInput
        {...args}
        name="email"
        value={value}
        onChange={setValue}
        validationSchema={emailSchema}
        validateOnChange={true}
        validateOnBlur={true}
      />
    )
  },
  args: {
    name: "email",
    label: "Email Address",
    placeholder: "Enter your email...",
    type: "email",
    required: true,
  },
}

// All input types showcase
export const AllTypes: Story = {
  render: () => {
    const [values, setValues] = useState({
      text: "",
      email: "",
      password: "",
      url: "",
      number: "",
      search: "",
    })

    const handleChange = (field: string) => (value: string) => {
      setValues((prev) => ({ ...prev, [field]: value }))
    }

    return (
      <div className="space-y-4 w-80">
        <ValidatedInput
          name="text"
          label="Text Input"
          placeholder="Enter text..."
          type="text"
          value={values.text}
          onChange={handleChange("text")}
        />

        <ValidatedInput
          name="email"
          label="Email Input"
          placeholder="Enter email..."
          type="email"
          value={values.email}
          onChange={handleChange("email")}
          validationSchema={emailSchema}
          validateOnChange={true}
        />

        <ValidatedInput
          name="password"
          label="Password Input"
          placeholder="Enter password..."
          type="password"
          value={values.password}
          onChange={handleChange("password")}
          validationSchema={passwordSchema}
          validateOnChange={true}
        />

        <ValidatedInput
          name="url"
          label="URL Input"
          placeholder="Enter URL..."
          type="url"
          value={values.url}
          onChange={handleChange("url")}
        />

        <ValidatedInput
          name="number"
          label="Number Input"
          placeholder="Enter number..."
          type="number"
          value={values.number}
          onChange={handleChange("number")}
        />

        <ValidatedInput
          name="search"
          label="Search Input"
          placeholder="Search..."
          type="search"
          value={values.search}
          onChange={handleChange("search")}
        />
      </div>
    )
  },
}

// Validation states showcase
export const ValidationStates: Story = {
  render: () => {
    const [values, setValues] = useState({
      valid: "user@example.com",
      invalid: "invalid-email",
      empty: "",
    })

    const handleChange = (field: string) => (value: string) => {
      setValues((prev) => ({ ...prev, [field]: value }))
    }

    return (
      <div className="space-y-4 w-80">
        <ValidatedInput
          name="valid"
          label="Valid Email"
          type="email"
          value={values.valid}
          onChange={handleChange("valid")}
          validationSchema={emailSchema}
          validateOnChange={true}
        />

        <ValidatedInput
          name="invalid"
          label="Invalid Email"
          type="email"
          value={values.invalid}
          onChange={handleChange("invalid")}
          validationSchema={emailSchema}
          validateOnChange={true}
        />

        <ValidatedInput
          name="empty"
          label="Empty Email"
          type="email"
          value={values.empty}
          onChange={handleChange("empty")}
          validationSchema={emailSchema}
          validateOnChange={true}
          required
        />
      </div>
    )
  },
}
