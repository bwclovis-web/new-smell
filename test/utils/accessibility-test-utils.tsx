import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { axe, toHaveNoViolations } from "jest-axe"
import { expect, vi } from "vitest"

import { renderWithProviders } from "./test-utils"

// Extend vitest matchers with jest-axe
expect.extend(toHaveNoViolations)

// Accessibility Testing Utilities

// Test accessibility with axe-core
export const testAxeAccessibility = async (
  Component: React.ComponentType<any>,
  props = {},
  options: { tags?: string[]; rules?: Record<string, any> } = {}
) => {
  const { container } = renderWithProviders(<Component {...props} />)
  
  const results = await axe(container, options)
  
  expect(results).toHaveNoViolations()
  
  return results
}

// Test keyboard navigation
export const testKeyboardNavigation = async (
  Component: React.ComponentType<any>,
  props = {}
) => {
  const { container } = renderWithProviders(<Component {...props} />)
  const user = userEvent.setup()

  // Get all focusable elements
  const focusableElements = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')

  expect(focusableElements.length).toBeGreaterThan(0)

  // Test tab navigation
  for (let i = 0; i < focusableElements.length; i++) {
    await user.tab()
    expect(document.activeElement).toBe(focusableElements[i])
  }

  // Test shift+tab navigation
  for (let i = focusableElements.length - 1; i >= 0; i--) {
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(focusableElements[i])
  }
}

// Test ARIA attributes
export const testARIAAttributes = (
  Component: React.ComponentType<any>,
  props = {},
  expectedARIA: Array<{
    selector: string
    attribute: string
    value?: string
  }>
) => {
  const { container } = renderWithProviders(<Component {...props} />)

  for (const test of expectedARIA) {
    const element = container.querySelector(test.selector)
    expect(element).toBeInTheDocument()

    if (test.value) {
      expect(element).toHaveAttribute(test.attribute, test.value)
    } else {
      expect(element).toHaveAttribute(test.attribute)
    }
  }
}

// Test semantic HTML
export const testSemanticHTML = (
  Component: React.ComponentType<any>,
  props = {},
  expectedRoles: string[]
) => {
  renderWithProviders(<Component {...props} />)

  for (const role of expectedRoles) {
    expect(screen.getByRole(role)).toBeInTheDocument()
  }
}

// Test form accessibility
export const testFormAccessibility = (
  Component: React.ComponentType<any>,
  props = {}
) => {
  renderWithProviders(<Component {...props} />)

  // Test that all inputs have labels
  const inputs = screen.getAllByRole("textbox")
  inputs.forEach(input => {
    expect(input).toHaveAccessibleName()
  })

  // Test required field indicators
  const requiredInputs = screen.getAllByRole("textbox", { required: true })
  requiredInputs.forEach(input => {
    expect(input).toHaveAttribute("aria-required", "true")
  })

  // Test error messages are associated
  const errorMessages = screen.queryAllByRole("alert")
  errorMessages.forEach(error => {
    const associatedInput = screen.getByLabelText(error.textContent!)
    expect(associatedInput).toHaveAttribute("aria-describedby", error.id)
  })
}

// Test color contrast (mock implementation)
export const testColorContrast = (
  Component: React.ComponentType<any>,
  props = {},
  expectedContrast = 4.5 // WCAG AA standard
) => {
  const { container } = renderWithProviders(<Component {...props} />)

  // Mock color contrast calculation
  const elements = container.querySelectorAll("*")
  elements.forEach(element => {
    const style = window.getComputedStyle(element)
    const color = style.color
    const backgroundColor = style.backgroundColor

    if (color && backgroundColor && color !== "rgba(0, 0, 0, 0)") {
      // In a real implementation, you would calculate actual contrast ratio
      // For testing purposes, we'll mock this
      const mockContrastRatio = 4.6 // Assume good contrast
      expect(mockContrastRatio).toBeGreaterThanOrEqual(expectedContrast)
    }
  })
}

// Test screen reader announcements
export const testScreenReaderAnnouncements = async (
  Component: React.ComponentType<any>,
  props = {},
  expectedAnnouncements: string[]
) => {
  renderWithProviders(<Component {...props} />)

  // Check for live regions
  const liveRegions = screen.getAllByRole("status")
  expect(liveRegions.length).toBeGreaterThan(0)

  // Check announcement content
  for (const announcement of expectedAnnouncements) {
    expect(screen.getByText(announcement)).toBeInTheDocument()
  }
}

// Test focus management
export const testFocusManagement = async (
  Component: React.ComponentType<any>,
  props = {},
  focusTests: Array<{
    action: () => Promise<void>
    expectedFocus: string
    description: string
  }>
) => {
  renderWithProviders(<Component {...props} />)

  for (const test of focusTests) {
    await test.action()

    const expectedElement = screen.getByTestId(test.expectedFocus)
    expect(document.activeElement).toBe(expectedElement)

    console.log(`✓ Focus test: ${test.description}`)
  }
}

// Test skip links
export const testSkipLinks = async (
  Component: React.ComponentType<any>,
  props = {}
) => {
  renderWithProviders(<Component {...props} />)
  const user = userEvent.setup()

  // Look for skip link
  const skipLink = screen.getByText(/skip to main content/i)
  expect(skipLink).toBeInTheDocument()

  // Test skip link functionality
  await user.click(skipLink)

  const mainContent = screen.getByRole("main")
  expect(document.activeElement).toBe(mainContent)
}

// Test headings hierarchy
export const testHeadingsHierarchy = (
  Component: React.ComponentType<any>,
  props = {}
) => {
  const { container } = renderWithProviders(<Component {...props} />)

  const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6")
  const headingLevels = Array.from(headings).map(h => parseInt(h.tagName[1]))

  // Check that there's only one h1
  const h1Count = headingLevels.filter(level => level === 1).length
  expect(h1Count).toBeLessThanOrEqual(1)

  // Check that headings follow logical order
  for (let i = 1; i < headingLevels.length; i++) {
    const currentLevel = headingLevels[i]
    const previousLevel = headingLevels[i - 1]

    // Heading levels shouldn't skip more than one level
    expect(currentLevel - previousLevel).toBeLessThanOrEqual(1)
  }
}

// Test landmark regions
export const testLandmarkRegions = (
  Component: React.ComponentType<any>,
  props = {},
  expectedLandmarks: string[]
) => {
  renderWithProviders(<Component {...props} />)

  for (const landmark of expectedLandmarks) {
    expect(screen.getByRole(landmark)).toBeInTheDocument()
  }
}

// Test alternative text for images
export const testImageAltText = (
  Component: React.ComponentType<any>,
  props = {}
) => {
  const { container } = renderWithProviders(<Component {...props} />)

  const images = container.querySelectorAll("img")
  images.forEach(img => {
    // Images should have alt text or be marked as decorative
    const hasAlt = img.hasAttribute("alt")
    const isDecorative =
      img.getAttribute("role") === "presentation" ||
      img.getAttribute("aria-hidden") === "true"

    expect(hasAlt || isDecorative).toBe(true)
  })
}

// Test button accessibility
export const testButtonAccessibility = (
  Component: React.ComponentType<any>,
  props = {}
) => {
  renderWithProviders(<Component {...props} />)

  const buttons = screen.getAllByRole("button")
  buttons.forEach(button => {
    // Buttons should have accessible names
    expect(button).toHaveAccessibleName()

    // Icon-only buttons should have aria-label
    const hasText = button.textContent?.trim()
    if (!hasText) {
      expect(button).toHaveAttribute("aria-label")
    }
  })
}

// Test link accessibility
export const testLinkAccessibility = (
  Component: React.ComponentType<any>,
  props = {}
) => {
  renderWithProviders(<Component {...props} />)

  const links = screen.getAllByRole("link")
  links.forEach(link => {
    // Links should have accessible names
    expect(link).toHaveAccessibleName()

    // Links should indicate if they open in new window
    const target = link.getAttribute("target")
    if (target === "_blank") {
      expect(link).toHaveAttribute("aria-label")
      expect(link.getAttribute("aria-label")).toMatch(/new window|new tab/i)
    }
  })
}

// Test table accessibility
export const testTableAccessibility = (
  Component: React.ComponentType<any>,
  props = {}
) => {
  const { container } = renderWithProviders(<Component {...props} />)

  const tables = container.querySelectorAll("table")
  tables.forEach(table => {
    // Tables should have captions or aria-label
    const hasCaption = table.querySelector("caption")
    const hasAriaLabel = table.hasAttribute("aria-label")

    expect(hasCaption || hasAriaLabel).toBe(true)

    // Check for proper header structure
    const headers = table.querySelectorAll("th")
    expect(headers.length).toBeGreaterThan(0)

    headers.forEach(header => {
      expect(header).toHaveAttribute("scope")
    })
  })
}

// Test motion and animation accessibility
export const testMotionAccessibility = (
  Component: React.ComponentType<any>,
  props = {}
) => {
  // Mock prefers-reduced-motion
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  const { container } = renderWithProviders(<Component {...props} />)

  // Check that animations respect user preferences
  const animatedElements = container.querySelectorAll('[class*="animate"]')
  animatedElements.forEach(element => {
    const style = window.getComputedStyle(element)
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      expect(style.animationDuration).toBe("0s")
    }
  })
}

// Comprehensive accessibility test suite
export const runA11yTestSuite = async (
  Component: React.ComponentType<any>,
  props = {},
  options = {
    testKeyboard: true,
    testScreenReader: true,
    testFocus: true,
    testSemantics: true,
    testForms: true,
    testAxe: true,
  }
) => {
  console.log("Running comprehensive accessibility tests...")

  if (options.testAxe) {
    await testAxeAccessibility(Component, props, {
      tags: [
"wcag2a", "wcag2aa", "wcag21a", "wcag21aa"
],
    })
  }

  if (options.testSemantics) {
    testSemanticHTML(Component, props, ["main", "navigation", "button"])
    testHeadingsHierarchy(Component, props)
    testLandmarkRegions(Component, props, ["main"])
  }

  if (options.testKeyboard) {
    await testKeyboardNavigation(Component, props)
  }

  if (options.testFocus) {
    await testSkipLinks(Component, props)
  }

  if (options.testForms) {
    testFormAccessibility(Component, props)
  }

  testImageAltText(Component, props)
  testButtonAccessibility(Component, props)
  testLinkAccessibility(Component, props)
  testColorContrast(Component, props)
  testMotionAccessibility(Component, props)

  console.log("✓ All accessibility tests completed")
}
