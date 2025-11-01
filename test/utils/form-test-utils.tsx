import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { renderWithProviders } from "./test-utils"

// Form Testing Utilities

// Fill form field by label
export const fillFormField = async (label: string, value: string) => {
  const user = userEvent.setup()
  const field = screen.getByLabelText(label)
  await user.clear(field)
  await user.type(field, value)
}

// Fill form field by test id
export const fillFormFieldByTestId = async (testId: string, value: string) => {
  const user = userEvent.setup()
  const field = screen.getByTestId(testId)
  await user.clear(field)
  await user.type(field, value)
}

// Submit form by button text
export const submitForm = async (buttonText: string = "Submit") => {
  const user = userEvent.setup()
  const submitButton = screen.getByRole("button", { name: buttonText })
  await user.click(submitButton)
}

// Test form validation
export const testFormValidation = async (
  formFields: Array<{
    label: string
    value: string
    expectedError?: string
  }>,
  submitButtonText = "Submit"
) => {
  const user = userEvent.setup()

  // Fill form fields
  for (const field of formFields) {
    await fillFormField(field.label, field.value)
  }

  // Submit form
  await submitForm(submitButtonText)

  // Check validation errors
  for (const field of formFields) {
    if (field.expectedError) {
      await waitFor(() => {
        expect(screen.getByText(field.expectedError!)).toBeInTheDocument()
      })
    }
  }
}

// Test form success submission
export const testFormSuccess = async (
  formFields: Array<{
    label: string
    value: string
  }>,
  successMessage: string,
  submitButtonText = "Submit"
) => {
  // Fill and submit form
  for (const field of formFields) {
    await fillFormField(field.label, field.value)
  }

  await submitForm(submitButtonText)

  // Check success message
  await waitFor(() => {
    expect(screen.getByText(successMessage)).toBeInTheDocument()
  })
}

// Test form field types
export const testFieldTypes = async (fieldTests: Array<{
    label: string
    type: string
    value: string
  }>) => {
  for (const test of fieldTests) {
    const field = screen.getByLabelText(test.label) as HTMLInputElement
    expect(field.type).toBe(test.type)

    await fillFormField(test.label, test.value)
    expect(field.value).toBe(test.value)
  }
}

// Note: testFormAccessibility has been moved to accessibility-test-utils.tsx for better organization

// Test form with different states
export const testFormStates = async (
  Component: React.ComponentType<any>,
  states: Array<{
    props: any
    description: string
    expectedElements: string[]
  }>
) => {
  for (const state of states) {
    const { unmount } = renderWithProviders(<Component {...state.props} />)

    for (const element of state.expectedElements) {
      expect(screen.getByText(element)).toBeInTheDocument()
    }

    unmount()
  }
}

// Mock form submission
export const mockFormSubmission = (
  success = true,
  response = { message: "Success" },
  delay = 100
) => vi.fn().mockImplementation(() => new Promise((resolve, reject) => {
        setTimeout(() => {
          if (success) {
            resolve(response)
          } else {
            reject(new Error(response.message || "Form submission failed"))
          }
        }, delay)
      }))

// Test form with file upload
export const testFileUpload = async (
  inputLabel: string,
  file: File,
  expectedFileName: string
) => {
  const user = userEvent.setup()
  const fileInput = screen.getByLabelText(inputLabel)

  await user.upload(fileInput, file)

  expect(screen.getByText(expectedFileName)).toBeInTheDocument()
}

// Test form with multiple file uploads
export const testMultipleFileUpload = async (
  inputLabel: string,
  files: File[],
  expectedFileNames: string[]
) => {
  const user = userEvent.setup()
  const fileInput = screen.getByLabelText(inputLabel)

  await user.upload(fileInput, files)

  for (const fileName of expectedFileNames) {
    expect(screen.getByText(fileName)).toBeInTheDocument()
  }
}

// Test form with dynamic fields
export const testDynamicFields = async (
  addButtonText: string,
  removeButtonText: string,
  fieldLabel: string,
  expectedFieldCount: number
) => {
  const user = userEvent.setup()

  // Add fields
  for (let i = 0; i < expectedFieldCount - 1; i++) {
    const addButton = screen.getByText(addButtonText)
    await user.click(addButton)
  }

  // Check field count
  const fields = screen.getAllByLabelText(new RegExp(fieldLabel, "i"))
  expect(fields).toHaveLength(expectedFieldCount)

  // Remove a field
  const removeButton = screen.getByText(removeButtonText)
  await user.click(removeButton)

  // Check updated field count
  const updatedFields = screen.getAllByLabelText(new RegExp(fieldLabel, "i"))
  expect(updatedFields).toHaveLength(expectedFieldCount - 1)
}

// Create test files for upload testing
export const createTestFile = (
  name: string = "test.txt",
  content: string = "test content",
  type: string = "text/plain"
) => new File([content], name, { type })

export const createTestImageFile = (
  name: string = "test.jpg",
  size: number = 1024
) => {
  const canvas = document.createElement("canvas")
  canvas.width = 100
  canvas.height = 100

  return new Promise<File>(resolve => {
    canvas.toBlob(blob => {
      resolve(new File([blob!], name, { type: "image/jpeg" }))
    }, "image/jpeg")
  })
}
