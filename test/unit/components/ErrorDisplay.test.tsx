import { fireEvent, render, screen } from "@testing-library/react"
import { BrowserRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"

import ErrorDisplay from "~/components/Containers/ErrorDisplay"
import { createError } from "~/utils/errorHandling"

// Wrapper for components that need Router context
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe("ErrorDisplay", () => {
  describe("Rendering", () => {
    it("should render error with title and message", () => {
      const error = createError.server("Test error")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      expect(screen.getByText("Server Error")).toBeInTheDocument()
      expect(
        screen.getByText(/something went wrong on our end/i)
      ).toBeInTheDocument()
    })

    it("should render with custom title", () => {
      const error = createError.server("Test error")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} title="Custom Title" />
        </RouterWrapper>
      )

      expect(screen.getByText("Custom Title")).toBeInTheDocument()
    })

    it("should render with custom className", () => {
      const error = createError.server("Test error")
      const { container } = render(
        <RouterWrapper>
          <ErrorDisplay error={error} className="custom-class" />
        </RouterWrapper>
      )

      expect(container.querySelector(".custom-class")).toBeInTheDocument()
    })
  })

  describe("Variants", () => {
    it("should render inline variant", () => {
      const error = createError.validation("Test error")
      const { container } = render(
        <RouterWrapper>
          <ErrorDisplay error={error} variant="inline" />
        </RouterWrapper>
      )

      expect(container.querySelector(".text-sm.text-red-600")).toBeInTheDocument()
    })

    it("should render banner variant", () => {
      const error = createError.validation("Test error")
      const { container } = render(
        <RouterWrapper>
          <ErrorDisplay error={error} variant="banner" />
        </RouterWrapper>
      )

      expect(container.querySelector(".border-l-4")).toBeInTheDocument()
    })

    it("should render card variant (default)", () => {
      const error = createError.validation("Test error")
      const { container } = render(
        <RouterWrapper>
          <ErrorDisplay error={error} variant="card" />
        </RouterWrapper>
      )

      expect(container.querySelector(".shadow-sm")).toBeInTheDocument()
    })
  })

  describe("Error Types", () => {
    it("should render AUTHENTICATION error with correct icon and title", () => {
      const error = createError.authentication("Auth error")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      expect(screen.getByLabelText(/authentication error icon/i)).toHaveTextContent(
        "🔐"
      )
      expect(screen.getByText("Authentication Required")).toBeInTheDocument()
    })

    it("should render AUTHORIZATION error with correct icon and title", () => {
      const error = createError.authorization("Authz error")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      expect(screen.getByLabelText(/authorization error icon/i)).toHaveTextContent(
        "🚫"
      )
      expect(screen.getByText("Access Denied")).toBeInTheDocument()
    })

    it("should render VALIDATION error with correct icon and title", () => {
      const error = createError.validation("Validation error")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      expect(screen.getByLabelText(/validation error icon/i)).toHaveTextContent("⚠️")
      expect(screen.getByText("Invalid Input")).toBeInTheDocument()
    })

    it("should render NOT_FOUND error with correct icon and title", () => {
      const error = createError.notFound("Not found error")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      expect(screen.getByLabelText(/not_found error icon/i)).toHaveTextContent("🔍")
      expect(screen.getByText("Not Found")).toBeInTheDocument()
    })

    it("should render NETWORK error with correct icon and title", () => {
      const error = createError.network("Network error")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      expect(screen.getByLabelText(/network error icon/i)).toHaveTextContent("🌐")
      expect(screen.getByText("Connection Error")).toBeInTheDocument()
    })

    it("should render DATABASE error with correct icon and title", () => {
      const error = createError.database("Database error")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      expect(screen.getByLabelText(/database error icon/i)).toHaveTextContent("🗄️")
      expect(screen.getByText("Database Error")).toBeInTheDocument()
    })

    it("should render SERVER error with correct icon and title", () => {
      const error = createError.server("Server error")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      expect(screen.getByLabelText(/server error icon/i)).toHaveTextContent("⚙️")
      expect(screen.getByText("Server Error")).toBeInTheDocument()
    })

    it("should render CLIENT error with correct icon and title", () => {
      const error = createError.client("Client error")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      expect(screen.getByLabelText(/client error icon/i)).toHaveTextContent("💻")
      expect(screen.getByText("Client Error")).toBeInTheDocument()
    })

    it("should render UNKNOWN error with default icon", () => {
      const error = new Error("Unknown error")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      expect(screen.getByLabelText(/unknown error icon/i)).toHaveTextContent("❌")
    })
  })

  describe("User-Friendly Messages", () => {
    it("should display user-friendly message for AUTH_ERROR", () => {
      const error = createError.authentication("Auth error", "AUTH_ERROR")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      expect(
        screen.getByText(/you need to be signed in to access this page/i)
      ).toBeInTheDocument()
      expect(screen.getByText(/please sign in to continue/i)).toBeInTheDocument()
    })

    it("should display user-friendly message for DB_ERROR", () => {
      const error = createError.database("DB error", "DB_ERROR")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      expect(
        screen.getByText(/having trouble connecting to our servers/i)
      ).toBeInTheDocument()
    })

    it("should display user-friendly message for NETWORK_ERROR", () => {
      const error = createError.network("Network error", "NETWORK_ERROR")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      expect(
        screen.getByText(/couldn't connect to our servers/i)
      ).toBeInTheDocument()
      expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument()
    })

    it("should display recovery suggestion", () => {
      const error = createError.authentication("Auth error", "AUTH_ERROR")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      expect(screen.getByText(/please sign in to continue/i)).toBeInTheDocument()
    })
  })

  describe("Actions", () => {
    it("should render retry button when onRetry is provided", () => {
      const onRetry = vi.fn()
      const error = createError.network("Network error")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} onRetry={onRetry} />
        </RouterWrapper>
      )

      const retryButton = screen.getByRole("button", {
        name: /retry the failed operation/i,
      })
      expect(retryButton).toBeInTheDocument()

      fireEvent.click(retryButton)
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it("should render dismiss button when onDismiss is provided", () => {
      const onDismiss = vi.fn()
      const error = createError.validation("Validation error")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} onDismiss={onDismiss} />
        </RouterWrapper>
      )

      const dismissButton = screen.getByRole("button", {
        name: /dismiss this error message/i,
      })
      expect(dismissButton).toBeInTheDocument()

      fireEvent.click(dismissButton)
      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it("should render navigation link for recovery action", () => {
      const error = createError.authentication("Auth error", "AUTH_ERROR")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      const link = screen.getByRole("link", { name: /navigate to sign in/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute("href", "/sign-in")
    })

    it("should render both retry and dismiss buttons", () => {
      const onRetry = vi.fn()
      const onDismiss = vi.fn()
      const error = createError.database("DB error")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} onRetry={onRetry} onDismiss={onDismiss} />
        </RouterWrapper>
      )

      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument()
    })

    it("should not render action buttons when no actions provided", () => {
      const error = createError.validation(
        "Validation error",
        "VALIDATION_MISSING_FIELD"
      )
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      expect(screen.queryByRole("button")).not.toBeInTheDocument()
      expect(screen.queryByRole("link")).not.toBeInTheDocument()
    })
  })

  describe("Technical Details", () => {
    it("should not show technical details by default", () => {
      const error = createError.server("Test error")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      expect(screen.queryByText("Error Code:")).not.toBeInTheDocument()
    })

    it("should show technical details when showDetails is true", () => {
      const error = createError.server("Test error")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} showDetails={true} />
        </RouterWrapper>
      )

      const details = screen.getByLabelText(/technical error details/i)
      expect(details).toBeInTheDocument()
    })

    it("should display error code in technical details", () => {
      const error = createError.server("Test error", "SERVER_ERROR")
      const { container } = render(
        <RouterWrapper>
          <ErrorDisplay error={error} showDetails={true} />
        </RouterWrapper>
      )

      const details = container.querySelector("details")
      expect(details).toBeInTheDocument()
      expect(details?.textContent).toContain("SERVER_ERROR")
      expect(details?.textContent).toContain("Error Code:")
    })

    it("should display error type in technical details", () => {
      const error = createError.database("Test error")
      const { container } = render(
        <RouterWrapper>
          <ErrorDisplay error={error} showDetails={true} />
        </RouterWrapper>
      )

      const details = container.querySelector("details")
      expect(details).toBeInTheDocument()
      expect(details?.textContent).toContain("DATABASE")
      expect(details?.textContent).toContain("Type:")
    })

    it("should display error severity in technical details", () => {
      const error = createError.server("Test error")
      const { container } = render(
        <RouterWrapper>
          <ErrorDisplay error={error} showDetails={true} />
        </RouterWrapper>
      )

      const details = container.querySelector("details")
      expect(details).toBeInTheDocument()
      expect(details?.textContent).toContain("Severity:")
    })

    it("should display error context when present", () => {
      const error = createError.server("Test error", "SERVER_ERROR", {
        userId: "123",
        action: "test",
      })
      const { container } = render(
        <RouterWrapper>
          <ErrorDisplay error={error} showDetails={true} />
        </RouterWrapper>
      )

      const details = container.querySelector("details")
      expect(details).toBeInTheDocument()
      expect(details?.textContent).toContain("Context:")
    })

    it("should not display context when empty", () => {
      const error = createError.server("Test error")
      const { container } = render(
        <RouterWrapper>
          <ErrorDisplay error={error} showDetails={true} />
        </RouterWrapper>
      )

      const details = container.querySelector("details")
      expect(details).toBeInTheDocument()
      expect(details?.textContent).not.toContain("Context:")
    })
  })

  describe("Accessibility", () => {
    it('should have role="alert" for card and banner variants', () => {
      const error = createError.validation("Test error")
      const { container } = render(
        <RouterWrapper>
          <ErrorDisplay error={error} variant="card" />
        </RouterWrapper>
      )

      const alert = container.querySelector('[role="alert"]')
      expect(alert).toBeInTheDocument()
    })

    it('should have aria-live="assertive" for card and banner variants', () => {
      const error = createError.validation("Test error")
      const { container } = render(
        <RouterWrapper>
          <ErrorDisplay error={error} variant="card" />
        </RouterWrapper>
      )

      const alert = container.querySelector('[aria-live="assertive"]')
      expect(alert).toBeInTheDocument()
    })

    it('should have aria-live="polite" for inline variant', () => {
      const error = createError.validation("Test error")
      const { container } = render(
        <RouterWrapper>
          <ErrorDisplay error={error} variant="inline" />
        </RouterWrapper>
      )

      const alert = container.querySelector('[aria-live="polite"]')
      expect(alert).toBeInTheDocument()
    })

    it('should have aria-atomic="true"', () => {
      const error = createError.validation("Test error")
      const { container } = render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      const alert = container.querySelector('[aria-atomic="true"]')
      expect(alert).toBeInTheDocument()
    })

    it("should have aria-labelledby and aria-describedby for card variant", () => {
      const error = createError.validation("Test error")
      const { container } = render(
        <RouterWrapper>
          <ErrorDisplay error={error} variant="card" />
        </RouterWrapper>
      )

      const alert = container.querySelector('[aria-labelledby="error-title"]')
      expect(alert).toBeInTheDocument()

      const described = container.querySelector('[aria-describedby="error-message"]')
      expect(described).toBeInTheDocument()
    })

    it("should have aria-label on error icon", () => {
      const error = createError.validation("Test error")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      const icon = screen.getByLabelText(/validation error icon/i)
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveAttribute("role", "img")
    })

    it("should have aria-label on recovery actions group", () => {
      const onRetry = vi.fn()
      const error = createError.network("Network error")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} onRetry={onRetry} />
        </RouterWrapper>
      )

      const actionsGroup = screen.getByRole("group", {
        name: /error recovery actions/i,
      })
      expect(actionsGroup).toBeInTheDocument()
    })

    it("should have aria-label on retry button", () => {
      const onRetry = vi.fn()
      const error = createError.network("Network error")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} onRetry={onRetry} />
        </RouterWrapper>
      )

      const retryButton = screen.getByRole("button", {
        name: /retry the failed operation/i,
      })
      expect(retryButton).toHaveAttribute("aria-label", "Retry the failed operation")
    })

    it("should have aria-label on dismiss button", () => {
      const onDismiss = vi.fn()
      const error = createError.validation("Validation error")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} onDismiss={onDismiss} />
        </RouterWrapper>
      )

      const dismissButton = screen.getByRole("button", {
        name: /dismiss this error message/i,
      })
      expect(dismissButton).toHaveAttribute(
        "aria-label",
        "Dismiss this error message"
      )
    })

    it("should have aria-label on navigation link", () => {
      const error = createError.authentication("Auth error", "AUTH_ERROR")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      const link = screen.getByRole("link", { name: /navigate to sign in/i })
      expect(link).toHaveAttribute("aria-label", "Navigate to Sign In")
    })

    it("should have focus styles on buttons", () => {
      const onRetry = vi.fn()
      const error = createError.network("Network error")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} onRetry={onRetry} />
        </RouterWrapper>
      )

      const retryButton = screen.getByRole("button", { name: /retry/i })
      expect(retryButton.className).toContain("focus:ring-2")
      expect(retryButton.className).toContain("focus:outline-none")
    })

    it("should have focus styles on links", () => {
      const error = createError.authentication("Auth error", "AUTH_ERROR")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      const link = screen.getByRole("link")
      expect(link.className).toContain("focus:ring-2")
      expect(link.className).toContain("focus:outline-none")
    })

    it("should have keyboard accessible details summary", () => {
      const error = createError.server("Test error")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} showDetails={true} />
        </RouterWrapper>
      )

      const summary = screen.getByText("Technical Details")
      expect(summary.className).toContain("focus:ring-2")
      expect(summary.className).toContain("focus:outline-none")
    })
  })

  describe("Edge Cases", () => {
    it("should handle non-AppError objects", () => {
      const error = new Error("Generic error")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      expect(screen.getByText("Error")).toBeInTheDocument()
      expect(screen.getByText("Generic error")).toBeInTheDocument()
    })

    it("should handle string errors", () => {
      render(
        <RouterWrapper>
          <ErrorDisplay error="String error" />
        </RouterWrapper>
      )

      // String errors are converted to generic errors with default message
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument()
    })

    it("should handle null context", () => {
      const error = createError.server("Test error")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} showDetails={true} />
        </RouterWrapper>
      )

      const summary = screen.getByText("Technical Details")
      fireEvent.click(summary)

      expect(screen.queryByText(/context:/i)).not.toBeInTheDocument()
    })

    it("should handle empty suggestion", () => {
      const error = createError.validation("Test error", "VALIDATION_MISSING_FIELD")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      // Should still render without crashing
      expect(screen.getByText("Invalid Input")).toBeInTheDocument()
    })

    it("should handle error without recovery action", () => {
      const error = createError.validation("Test error")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      // Should not have navigation link
      expect(screen.queryByRole("link")).not.toBeInTheDocument()
    })
  })

  describe("Integration", () => {
    it("should display complete error flow for authentication error", () => {
      const error = createError.authentication("Auth required", "AUTH_ERROR")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      // Title
      expect(screen.getByText("Authentication Required")).toBeInTheDocument()
      // Message
      expect(screen.getByText(/you need to be signed in/i)).toBeInTheDocument()
      // Suggestion
      expect(screen.getByText(/please sign in to continue/i)).toBeInTheDocument()
      // Action
      expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument()
    })

    it("should display complete error flow for database error with retry", () => {
      const onRetry = vi.fn()
      const error = createError.database("Connection failed", "DB_ERROR")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} onRetry={onRetry} />
        </RouterWrapper>
      )

      // Title
      expect(screen.getByText("Database Error")).toBeInTheDocument()
      // Message
      expect(
        screen.getByText(/having trouble connecting to our servers/i)
      ).toBeInTheDocument()
      // Suggestion
      expect(screen.getByText(/try again in a few moments/i)).toBeInTheDocument()
      // Retry button
      const retryButton = screen.getByRole("button", { name: /retry/i })
      expect(retryButton).toBeInTheDocument()

      fireEvent.click(retryButton)
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it("should display complete error flow for validation error", () => {
      const error = createError.validation("Invalid email", "VALIDATION_ERROR")
      render(
        <RouterWrapper>
          <ErrorDisplay error={error} />
        </RouterWrapper>
      )

      // Title - generic validation error title
      expect(screen.getByText("Invalid Input")).toBeInTheDocument()
      // Message
      expect(
        screen.getByText(/please check your input and try again/i)
      ).toBeInTheDocument()
      // Suggestion
      expect(
        screen.getByText(/make sure all required fields are filled in correctly/i)
      ).toBeInTheDocument()
      // No action buttons for validation errors (no retry or navigation)
      expect(screen.queryByRole("button")).not.toBeInTheDocument()
      expect(screen.queryByRole("link")).not.toBeInTheDocument()
    })
  })
})
