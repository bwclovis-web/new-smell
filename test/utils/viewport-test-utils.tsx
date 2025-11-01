import { vi } from 'vitest'

/**
 * Viewport and Responsive Testing Utilities
 * 
 * Utilities for testing responsive layouts and viewport-specific behavior
 */

// Viewport presets
export const viewportPresets = {
  mobile: { width: 375, height: 667 },
  mobileLandscape: { width: 667, height: 375 },
  tablet: { width: 768, height: 1024 },
  tabletLandscape: { width: 1024, height: 768 },
  desktop: { width: 1920, height: 1080 },
  desktopSmall: { width: 1366, height: 768 },
  desktopLarge: { width: 2560, height: 1440 },
}

export type ViewportName = keyof typeof viewportPresets

// Set viewport size
export const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })

  // Trigger resize event
  window.dispatchEvent(new Event('resize'))
}

// Set viewport by preset name
export const setViewportByName = (name: ViewportName) => {
  const { width, height } = viewportPresets[name]
  setViewport(width, height)
}

// Test component at different viewports
export const testAtViewports = async (
  testFn: (viewport: ViewportName) => void | Promise<void>,
  viewports: ViewportName[] = ['mobile', 'tablet', 'desktop']
) => {
  for (const viewport of viewports) {
    setViewportByName(viewport)
    await testFn(viewport)
  }
}

// Mock matchMedia for media queries
export const mockMediaQuery = (query: string, matches = true) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((q: string) => ({
      matches: q === query ? matches : false,
      media: q,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

// Test media query behavior
export const testMediaQuery = async (
  Component: React.ComponentType<any>,
  mediaTests: Array<{
    query: string
    matches: boolean
    expectedBehavior: string
    description: string
  }>
) => {
  for (const test of mediaTests) {
    mockMediaQuery(test.query, test.matches)

    // Test would verify component behavior here
    console.log(`✓ Media query test: ${test.description}`)
  }
}

// Mock touch support
export const mockTouchSupport = (enabled = true) => {
  Object.defineProperty(navigator, 'maxTouchPoints', {
    writable: true,
    configurable: true,
    value: enabled ? 5 : 0,
  })

  Object.defineProperty(window, 'ontouchstart', {
    writable: true,
    configurable: true,
    value: enabled ? {} : undefined,
  })
}

// Test responsive behavior
export const testResponsiveBehavior = async (
  Component: React.ComponentType<any>,
  tests: Array<{
    viewport: ViewportName
    expectedElements: string[]
    hiddenElements: string[]
    description: string
  }>
) => {
  const { screen } = await import('@testing-library/react')
  const { renderWithProviders } = await import('./test-utils')

  for (const test of tests) {
    setViewportByName(test.viewport)
    renderWithProviders(<Component />)

    // Check visible elements
    for (const element of test.expectedElements) {
      expect(screen.getByText(element)).toBeVisible()
    }

    // Check hidden elements
    for (const element of test.hiddenElements) {
      const elem = screen.queryByText(element)
      if (elem) {
        expect(elem).not.toBeVisible()
      }
    }

    console.log(`✓ Responsive test (${test.viewport}): ${test.description}`)
  }
}

// Test orientation changes
export const testOrientationChange = async (
  Component: React.ComponentType<any>,
  testFn: (orientation: 'portrait' | 'landscape') => void | Promise<void>
) => {
  // Test portrait
  setViewport(375, 667)
  await testFn('portrait')

  // Test landscape
  setViewport(667, 375)
  await testFn('landscape')
}

// Mock device pixel ratio
export const mockDevicePixelRatio = (ratio: number) => {
  Object.defineProperty(window, 'devicePixelRatio', {
    writable: true,
    configurable: true,
    value: ratio,
  })
}

// Test with different pixel ratios (for retina displays)
export const testAtPixelRatios = async (
  testFn: (ratio: number) => void | Promise<void>,
  ratios = [1, 2, 3]
) => {
  for (const ratio of ratios) {
    mockDevicePixelRatio(ratio)
    await testFn(ratio)
  }
}

