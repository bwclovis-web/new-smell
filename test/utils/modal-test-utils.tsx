import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

/**
 * Modal and Dialog Testing Utilities
 *
 * Utilities for testing modal dialogs, overlays, and popups
 */

// Test modal opening
export const testModalOpen = async (
  triggerSelector: string,
  expectedModalContent: string
) => {
  const user = userEvent.setup()
  const trigger = screen.getByTestId(triggerSelector)

  await user.click(trigger)

  await waitFor(() => {
    expect(screen.getByText(expectedModalContent)).toBeInTheDocument()
  })
}

// Test modal closing
export const testModalClose = async (
  closeMethod: "button" | "overlay" | "escape" = "button"
) => {
  const user = userEvent.setup()

  switch (closeMethod) {
    case "button":
      const closeButton = screen.getByRole("button", { name: /close/i })
      await user.click(closeButton)
      break

    case "overlay":
      const overlay = screen.getByTestId("modal-overlay")
      await user.click(overlay)
      break

    case "escape":
      await user.keyboard("{Escape}")
      break
  }

  await waitFor(() => {
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
}

// Test modal focus trap
export const testModalFocusTrap = async (modalSelector: string) => {
  const user = userEvent.setup()
  const modal = screen.getByTestId(modalSelector)
  const focusableElements = within(modal).getAllByRole("button")

  expect(focusableElements.length).toBeGreaterThan(0)

  // Focus should be trapped within modal
  for (let i = 0; i < focusableElements.length + 1; i++) {
    await user.tab()
  }

  // After cycling through all elements, should return to first
  expect(document.activeElement).toBe(focusableElements[0])
}

// Test modal backdrop
export const testModalBackdrop = async () => {
  const backdrop = screen.getByTestId("modal-backdrop")

  expect(backdrop).toBeInTheDocument()
  expect(backdrop).toHaveClass("backdrop")

  // Test backdrop opacity
  const style = window.getComputedStyle(backdrop)
  expect(parseFloat(style.opacity)).toBeGreaterThan(0)
}

// Test modal animations
export const testModalAnimations = async (
  expectedAnimation: "fade" | "slide" | "zoom" = "fade"
) => {
  const modal = screen.getByRole("dialog")

  switch (expectedAnimation) {
    case "fade":
      expect(modal).toHaveClass("fade")
      break
    case "slide":
      expect(modal).toHaveClass("slide")
      break
    case "zoom":
      expect(modal).toHaveClass("zoom")
      break
  }
}

// Test modal accessibility
export const testModalAccessibility = () => {
  const modal = screen.getByRole("dialog")

  // Should have aria-modal
  expect(modal).toHaveAttribute("aria-modal", "true")

  // Should have aria-labelledby or aria-label
  const hasLabel =
    modal.hasAttribute("aria-labelledby") || modal.hasAttribute("aria-label")
  expect(hasLabel).toBe(true)

  // Should have role="dialog"
  expect(modal).toHaveAttribute("role", "dialog")
}

// Test modal with form
export const testModalForm = async (
  formData: Record<string, string>,
  submitButtonText = "Submit"
) => {
  const user = userEvent.setup()
  const modal = screen.getByRole("dialog")

  // Fill form within modal
  for (const [label, value] of Object.entries(formData)) {
    const input = within(modal).getByLabelText(label)
    await user.type(input, value)
  }

  // Submit form
  const submitButton = within(modal).getByRole("button", {
    name: submitButtonText,
  })
  await user.click(submitButton)

  // Modal should close after submission
  await waitFor(() => {
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
}

// Test modal stacking (multiple modals)
export const testModalStacking = async (modalCount: number) => {
  const modals = screen.getAllByRole("dialog")

  expect(modals).toHaveLength(modalCount)

  // Check z-index stacking
  for (let i = 0; i < modals.length; i++) {
    const style = window.getComputedStyle(modals[i])
    const zIndex = parseInt(style.zIndex)

    if (i > 0) {
      const prevStyle = window.getComputedStyle(modals[i - 1])
      const prevZIndex = parseInt(prevStyle.zIndex)
      expect(zIndex).toBeGreaterThan(prevZIndex)
    }
  }
}

// Test confirmation modal
export const testConfirmationModal = async (
  action: () => Promise<void>,
  expectedMessage: string,
  shouldConfirm = true
) => {
  const user = userEvent.setup()

  // Trigger action that shows confirmation
  await action()

  // Verify confirmation modal appears
  await waitFor(() => {
    expect(screen.getByText(expectedMessage)).toBeInTheDocument()
  })

  // Click confirm or cancel
  const button = shouldConfirm
    ? screen.getByRole("button", { name: /confirm|yes|ok/i })
    : screen.getByRole("button", { name: /cancel|no/i })

  await user.click(button)

  // Modal should close
  await waitFor(() => {
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
}

// Test modal scroll lock
export const testModalScrollLock = () => {
  // When modal is open, body should not be scrollable
  expect(document.body.style.overflow).toBe("hidden")

  // After modal closes, body should be scrollable again
  // (Test this in the actual test after closing the modal)
}

// Mock modal context
export const mockModalContext = (isOpen = false, onClose = vi.fn()) => ({
  isOpen,
  onClose,
  onOpen: vi.fn(),
  toggle: vi.fn(),
})

// Test modal portal rendering
export const testModalPortal = () => {
  const modal = screen.getByRole("dialog")
  const parent = modal.parentElement

  // Modal should be rendered in a portal (usually body or a dedicated div)
  expect(parent?.id).toMatch(/portal|modal-root/)
}

// Test modal size variants
export const testModalSizes = (
  Component: React.ComponentType<any>,
  sizes: Array<{
    size: "small" | "medium" | "large" | "fullscreen"
    expectedWidth: string
  }>
) => {
  const { renderWithProviders } = require("./test-utils")

  for (const { size, expectedWidth } of sizes) {
    const { unmount } = renderWithProviders(<Component size={size} isOpen={true} />)

    const modal = screen.getByRole("dialog")
    const style = window.getComputedStyle(modal)

    expect(style.width).toBe(expectedWidth)

    unmount()
  }
}

// Test modal with loading state
export const testModalLoadingState = async () => {
  const modal = screen.getByRole("dialog")

  // Should show loading indicator
  expect(within(modal).getByText(/loading/i)).toBeInTheDocument()

  // Submit button should be disabled
  const submitButton = within(modal).queryByRole("button", { name: /submit/i })
  if (submitButton) {
    expect(submitButton).toBeDisabled()
  }
}
