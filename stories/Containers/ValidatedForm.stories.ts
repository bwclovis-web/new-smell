/**
 * ValidatedForm component stories for Storybook
 */

import type { Meta, StoryObj } from "@storybook/react"
import { z } from "zod"
import ValidatedForm from "~/components/Containers/ValidatedForm/ValidatedForm"
import ValidatedInput from "~/components/Atoms/ValidatedInput/ValidatedInput"
import { Button } from "~/components/Atoms/Button/Button"

// User registration schema
const UserRegistrationSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[0-9]/, "Password must contain a number")
      .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

// Perfume creation schema
const PerfumeCreationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid number"),
  house: z.string().min(1, "Perfume house is required"),
})

const meta: Meta<typeof ValidatedForm> = {
  title: "Containers/ValidatedForm",
  component: ValidatedForm,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Form container with comprehensive validation and state management.",
      },
    },
  },
  argTypes: {
    validateOnChange: {
      control: "boolean",
      description: "Whether to validate on field change",
    },
    validateOnBlur: {
      control: "boolean",
      description: "Whether to validate on field blur",
    },
    validateOnSubmit: {
      control: "boolean",
      description: "Whether to validate on form submission",
    },
    debounceMs: {
      control: "number",
      description: "Debounce delay in milliseconds",
    },
  },
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof meta>

// User registration form
export const UserRegistration: Story = {
  render: (args) => (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center"> Create Account</h2>

      <ValidatedForm
        {...args}
        schema={UserRegistrationSchema}
        initialValues={{
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
        }}
        onSubmit={async (data) => {
          console.log("Registration data:", data)
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }}
      >
        {({ values, errors, handleChange, handleBlur, isSubmitting, isValid }) => (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <ValidatedInput
                name="firstName"
                label="First Name"
                value={values.firstName}
                onChange={handleChange("firstName")}
                onBlur={handleBlur("firstName")}
                error={errors.firstName}
                required
              />

              <ValidatedInput
                name="lastName"
                label="Last Name"
                value={values.lastName}
                onChange={handleChange("lastName")}
                onBlur={handleBlur("lastName")}
                error={errors.lastName}
                required
              />
            </div>

            <ValidatedInput
              name="email"
              label="Email Address"
              type="email"
              value={values.email}
              onChange={handleChange("email")}
              onBlur={handleBlur("email")}
              error={errors.email}
              required
            />

            <ValidatedInput
              name="password"
              label="Password"
              type="password"
              value={values.password}
              onChange={handleChange("password")}
              onBlur={handleBlur("password")}
              error={errors.password}
              required
              helpText="Must be at least 8 characters with uppercase, lowercase, number, and special character"
            />

            <ValidatedInput
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              value={values.confirmPassword}
              onChange={handleChange("confirmPassword")}
              onBlur={handleBlur("confirmPassword")}
              error={errors.confirmPassword}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={!isValid || isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          </div>
        )}
      </ValidatedForm>
    </div>
  ),
  args: {
    validateOnChange: true,
    validateOnBlur: true,
    validateOnSubmit: true,
    debounceMs: 300,
  },
}

// Perfume creation form
export const PerfumeCreation: Story = {
  render: (args) => (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center"> Add New Perfume</h2>

      <ValidatedForm
        {...args}
        schema={PerfumeCreationSchema}
        initialValues={{
          name: "",
          description: "",
          price: "",
          house: "",
        }}
        onSubmit={async (data) => {
          console.log("Perfume data:", data)
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }}
      >
        {({ values, errors, handleChange, handleBlur, isSubmitting, isValid }) => (
          <div className="space-y-4">
            <ValidatedInput
              name="name"
              label="Perfume Name"
              value={values.name}
              onChange={handleChange("name")}
              onBlur={handleBlur("name")}
              error={errors.name}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={values.description}
                onChange={(e) => handleChange("description")(e.target.value)}
                onBlur={handleBlur("description")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Enter perfume description..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600"> {errors.description} </p>
              )}
            </div>

            <ValidatedInput
              name="price"
              label="Price"
              type="number"
              value={values.price}
              onChange={handleChange("price")}
              onBlur={handleBlur("price")}
              error={errors.price}
              placeholder="0.00"
              step="0.01"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Perfume House
              </label>
              <select
                name="house"
                value={values.house}
                onChange={(e) => handleChange("house")(e.target.value)}
                onBlur={handleBlur("house")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value=""> Select a perfume house </option>
                <option value="chanel"> Chanel </option>
                <option value="dior"> Dior </option>
                <option value="gucci"> Gucci </option>
                <option value="tom-ford"> Tom Ford </option>
                <option value="yves-saint-laurent"> Yves Saint Laurent </option>
              </select>
              {errors.house && (
                <p className="mt-1 text-sm text-red-600"> {errors.house} </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="flex-1"
                disabled={!isValid || isSubmitting}
                loading={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Perfume"}
              </Button>

              <Button type="button" variant="secondary" size="lg" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </ValidatedForm>
    </div>
  ),
  args: {
    validateOnChange: true,
    validateOnBlur: true,
    validateOnSubmit: true,
    debounceMs: 300,
  },
}

// Contact form
export const ContactForm: Story = {
  render: (args) => {
    const ContactSchema = z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      email: z.string().email("Please enter a valid email address"),
      subject: z.string().min(5, "Subject must be at least 5 characters"),
      message: z.string().min(10, "Message must be at least 10 characters"),
    })

    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center"> Contact Us </h2>

        <ValidatedForm
          {...args}
          schema={ContactSchema}
          initialValues={{
            name: "",
            email: "",
            subject: "",
            message: "",
          }}
          onSubmit={async (data) => {
            console.log("Contact data:", data)
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }}
        >
          {({ values, errors, handleChange, handleBlur, isSubmitting, isValid }) => (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedInput
                  name="name"
                  label="Your Name"
                  value={values.name}
                  onChange={handleChange("name")}
                  onBlur={handleBlur("name")}
                  error={errors.name}
                  required
                />

                <ValidatedInput
                  name="email"
                  label="Email Address"
                  type="email"
                  value={values.email}
                  onChange={handleChange("email")}
                  onBlur={handleBlur("email")}
                  error={errors.email}
                  required
                />
              </div>

              <ValidatedInput
                name="subject"
                label="Subject"
                value={values.subject}
                onChange={handleChange("subject")}
                onBlur={handleBlur("subject")}
                error={errors.subject}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  name="message"
                  value={values.message}
                  onChange={(e) => handleChange("message")(e.target.value)}
                  onBlur={handleBlur("message")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={6}
                  placeholder="Enter your message..."
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600"> {errors.message} </p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={!isValid || isSubmitting}
                loading={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </div>
          )}
        </ValidatedForm>
      </div>
    )
  },
  args: {
    validateOnChange: true,
    validateOnBlur: true,
    validateOnSubmit: true,
    debounceMs: 300,
  },
}

// Form with validation disabled
export const NoValidation: Story = {
  render: (args) => (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center"> Simple Form</h2>

      <ValidatedForm
        {...args}
        schema={UserRegistrationSchema}
        initialValues={{
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
        }}
        onSubmit={async (data) => {
          console.log("Form data:", data)
        }}
      >
        {({ values, errors, handleChange, handleBlur, isSubmitting }) => (
          <div className="space-y-4">
            <ValidatedInput
              name="firstName"
              label="First Name"
              value={values.firstName}
              onChange={handleChange("firstName")}
              onBlur={handleBlur("firstName")}
              error={errors.firstName}
            />

            <ValidatedInput
              name="lastName"
              label="Last Name"
              value={values.lastName}
              onChange={handleChange("lastName")}
              onBlur={handleBlur("lastName")}
              error={errors.lastName}
            />

            <ValidatedInput
              name="email"
              label="Email Address"
              type="email"
              value={values.email}
              onChange={handleChange("email")}
              onBlur={handleBlur("email")}
              error={errors.email}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        )}
      </ValidatedForm>
    </div>
  ),
  args: {
    validateOnChange: false,
    validateOnBlur: false,
    validateOnSubmit: false,
    debounceMs: 0,
  },
}
