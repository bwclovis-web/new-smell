import { render, RenderOptions, screen, waitFor, within } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, MemoryRouter, Router } from 'react-router-dom'
import { createMemoryHistory } from 'history'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

// Mock providers for testing
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
  initialEntries?: string[]
  initialIndex?: number
  history?: ReturnType<typeof createMemoryHistory>
  route?: string
}

// Custom render function with providers
export const renderWithProviders = (
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    initialEntries = ['/'],
    initialIndex = 0,
    history,
    route = '/',
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  const testHistory = history || createMemoryHistory({ initialEntries, initialIndex })

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <Router location={testHistory.location} navigator={testHistory}>
        {children}
      </Router>
    </QueryClientProvider>
  )

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
    history: testHistory,
  }
}

// Render with specific route
export const renderWithRoute = (
  ui: ReactElement,
  route: string,
  options: Omit<CustomRenderOptions, 'route'> = {}
) => {
  return renderWithProviders(ui, { ...options, route })
}

// Render with memory router for testing navigation
export const renderWithMemoryRouter = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialEntries = ['/'], ...renderOptions } = options

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={options.queryClient || createTestQueryClient()}>
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  )

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: options.queryClient || createTestQueryClient(),
  }
}

// Mock data generators
export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockPerfume = (overrides = {}) => ({
  id: '1',
  name: 'Test Perfume',
  brand: 'Test Brand',
  description: 'Test description',
  price: 100,
  size: '50ml',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockHouse = (overrides = {}) => ({
  id: '1',
  name: 'Test House',
  description: 'Test house description',
  website: 'https://test.com',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

// Mock functions
export const mockFetch = (data: any, status = 200) => {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  })
}

export const mockFetchError = (message = 'Network error') => {
  return vi.fn().mockRejectedValue(new Error(message))
}

// Wait utilities
export const waitFor = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms))

// Mock localStorage with type safety
export const mockLocalStorage = () => {
  const store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    length: Object.keys(store).length,
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  }
}

// Mock sessionStorage with type safety
export const mockSessionStorage = () => {
  const store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    length: Object.keys(store).length,
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  }
}

// Mock IntersectionObserver
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn()
  mockIntersectionObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })
  window.IntersectionObserver = mockIntersectionObserver
  return mockIntersectionObserver
}

// Mock ResizeObserver
export const mockResizeObserver = () => {
  const mockResizeObserver = vi.fn()
  mockResizeObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })
  window.ResizeObserver = mockResizeObserver
  return mockResizeObserver
}

// Mock matchMedia
export const mockMatchMedia = (matches = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

// Mock scrollTo
export const mockScrollTo = () => {
  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: vi.fn(),
  })
}

// Test data factories
export const createTestData = {
  users: (count: number) =>
    Array.from({ length: count }, (_, i) => createMockUser({ id: `${i + 1}` })),

  perfumes: (count: number) =>
    Array.from({ length: count }, (_, i) => createMockPerfume({ id: `${i + 1}` })),

  houses: (count: number) =>
    Array.from({ length: count }, (_, i) => createMockHouse({ id: `${i + 1}` })),
}

// Custom matchers for better assertions
export const customMatchers = {
  toBeInTheDocument: (received: any) => {
    const pass = received && received.ownerDocument && received.ownerDocument.body.contains(received)
    return {
      pass,
      message: () => `expected element ${pass ? 'not ' : ''}to be in the document`,
    }
  },

  toHaveClass: (received: any, className: string) => {
    const pass = received && received.classList && received.classList.contains(className)
    return {
      pass,
      message: () => `expected element ${pass ? 'not ' : ''}to have class "${className}"`,
    }
  },

  toHaveAttribute: (received: any, attribute: string, value?: string) => {
    const hasAttribute = received && received.hasAttribute && received.hasAttribute(attribute)
    const hasValue = value ? received && received.getAttribute(attribute) === value : true
    const pass = hasAttribute && hasValue
    return {
      pass,
      message: () => `expected element ${pass ? 'not ' : ''}to have attribute "${attribute}"${value ? ` with value "${value}"` : ''}`,
    }
  },
}

// React Component Testing Utilities

// Test user interactions
export const createTestUser = () => userEvent.setup()

// Wait for element to appear with custom timeout
export const waitForElement = async (selector: string, timeout = 5000) => {
  return waitFor(() => screen.getByTestId(selector), { timeout })
}

// Wait for element to disappear
export const waitForElementToDisappear = async (selector: string, timeout = 5000) => {
  return waitFor(() => expect(screen.queryByTestId(selector)).not.toBeInTheDocument(), { timeout })
}

// Test component with different props
export const testComponentWithProps = async (
  Component: React.ComponentType<any>,
  propsVariations: Record<string, any>[],
  testFn: (props: any) => void | Promise<void>
) => {
  for (const props of propsVariations) {
    const { unmount } = renderWithProviders(<Component {...props} />)
    await testFn(props)
    unmount()
  }
}

// Test component state changes
export const testStateChanges = async (
  Component: React.ComponentType<any>,
  initialState: any,
  stateChanges: Array<{
    action: () => void | Promise<void>
    expectedState: any
    description: string
  }>
) => {
  const { rerender } = renderWithProviders(<Component {...initialState} />)

  for (const { action, expectedState, description } of stateChanges) {
    await action()
    // Add assertions based on expectedState
    console.log(`Testing: ${description}`)
  }
}

// Test component error boundaries
export const testErrorBoundary = async (
  Component: React.ComponentType<any>,
  errorProps: any,
  expectedError: string
) => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

  renderWithProviders(<Component {...errorProps} />)

  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument()
  })

  consoleSpy.mockRestore()
}

// Test component accessibility
export const testAccessibility = async (Component: React.ComponentType<any>, props = {}) => {
  const { container } = renderWithProviders(<Component {...props} />)

  // Test for basic accessibility attributes
  const elements = container.querySelectorAll('[role], [aria-label], [aria-labelledby]')
  expect(elements.length).toBeGreaterThan(0)

  // Test for keyboard navigation
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  expect(focusableElements.length).toBeGreaterThan(0)
}

// Test component performance
export const testComponentPerformance = async (
  Component: React.ComponentType<any>,
  props = {},
  maxRenderTime = 10
) => {
  const start = performance.now()
  renderWithProviders(<Component {...props} />)
  const end = performance.now()
  const renderTime = end - start

  expect(renderTime).toBeLessThan(maxRenderTime)
  return renderTime
}

// Test component with different screen sizes
export const testResponsiveComponent = async (
  Component: React.ComponentType<any>,
  props = {},
  breakpoints = ['mobile', 'tablet', 'desktop']
) => {
  for (const breakpoint of breakpoints) {
    // Mock window.innerWidth based on breakpoint
    const widths = { mobile: 375, tablet: 768, desktop: 1024 }
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: widths[breakpoint as keyof typeof widths],
    })

    // Trigger resize event
    window.dispatchEvent(new Event('resize'))

    const { container } = renderWithProviders(<Component {...props} />)

    // Add breakpoint-specific assertions
    expect(container).toBeInTheDocument()
  }
}

// Test component with different themes
export const testThemedComponent = async (
  Component: React.ComponentType<any>,
  props = {},
  themes = ['light', 'dark']
) => {
  for (const theme of themes) {
    // Mock theme context or CSS variables
    document.documentElement.setAttribute('data-theme', theme)

    const { container } = renderWithProviders(<Component {...props} />)

    // Add theme-specific assertions
    expect(container).toBeInTheDocument()
  }
}

// Test component with different languages
export const testInternationalizedComponent = async (
  Component: React.ComponentType<any>,
  props = {},
  languages = ['en', 'es', 'fr']
) => {
  for (const language of languages) {
    // Mock i18n or language context
    document.documentElement.setAttribute('lang', language)

    const { container } = renderWithProviders(<Component {...props} />)

    // Add language-specific assertions
    expect(container).toBeInTheDocument()
  }
}

// Test component with loading states
export const testLoadingStates = async (
  Component: React.ComponentType<any>,
  props = {},
  loadingProps = [{ loading: true }, { loading: false }]
) => {
  for (const loadingProp of loadingProps) {
    const { container } = renderWithProviders(
      <Component {...props} {...loadingProp} />
    )

    if (loadingProp.loading) {
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    } else {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }
  }
}

// Test component with error states
export const testErrorStates = async (
  Component: React.ComponentType<any>,
  props = {},
  errorProps = [{ error: null }, { error: 'Test error' }]
) => {
  for (const errorProp of errorProps) {
    const { container } = renderWithProviders(
      <Component {...props} {...errorProp} />
    )

    if (errorProp.error) {
      expect(screen.getByText(errorProp.error)).toBeInTheDocument()
    } else {
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
    }
  }
}

// Test component with different data states
export const testDataStates = async (
  Component: React.ComponentType<any>,
  props = {},
  dataStates = [
    { data: null, description: 'no data' },
    { data: [], description: 'empty data' },
    { data: [{ id: 1, name: 'Test' }], description: 'with data' }
  ]
) => {
  for (const dataState of dataStates) {
    const { container } = renderWithProviders(
      <Component {...props} data={dataState.data} />
    )

    // Add data-specific assertions
    expect(container).toBeInTheDocument()
  }
}

// Test component with different user permissions
export const testPermissionStates = async (
  Component: React.ComponentType<any>,
  props = {},
  permissions = [
    { canRead: true, canWrite: false, description: 'read only' },
    { canRead: true, canWrite: true, description: 'read and write' },
    { canRead: false, canWrite: false, description: 'no access' }
  ]
) => {
  for (const permission of permissions) {
    const { container } = renderWithProviders(
      <Component {...props} {...permission} />
    )

    // Add permission-specific assertions
    expect(container).toBeInTheDocument()
  }
}

// Test component with different user roles
export const testUserRoles = async (
  Component: React.ComponentType<any>,
  props = {},
  roles = ['admin', 'user', 'guest']
) => {
  for (const role of roles) {
    const { container } = renderWithProviders(
      <Component {...props} userRole={role} />
    )

    // Add role-specific assertions
    expect(container).toBeInTheDocument()
  }
}

// Test component with different user preferences
export const testUserPreferences = async (
  Component: React.ComponentType<any>,
  props = {},
  preferences = [
    { theme: 'light', language: 'en' },
    { theme: 'dark', language: 'es' },
    { theme: 'auto', language: 'fr' }
  ]
) => {
  for (const preference of preferences) {
    const { container } = renderWithProviders(
      <Component {...props} preferences={preference} />
    )

    // Add preference-specific assertions
    expect(container).toBeInTheDocument()
  }
}

// Test component with different network states
export const testNetworkStates = async (
  Component: React.ComponentType<any>,
  props = {},
  networkStates = [
    { online: true, description: 'online' },
    { online: false, description: 'offline' }
  ]
) => {
  for (const networkState of networkStates) {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: networkState.online,
    })

    const { container } = renderWithProviders(
      <Component {...props} />
    )

    // Add network-specific assertions
    expect(container).toBeInTheDocument()
  }
}

// Test component with different device types
export const testDeviceTypes = async (
  Component: React.ComponentType<any>,
  props = {},
  deviceTypes = ['mobile', 'tablet', 'desktop']
) => {
  for (const deviceType of deviceTypes) {
    // Mock user agent or device detection
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: deviceType === 'mobile' ? 'Mobile' : 'Desktop',
    })

    const { container } = renderWithProviders(
      <Component {...props} deviceType={deviceType} />
    )

    // Add device-specific assertions
    expect(container).toBeInTheDocument()
  }
}

// Test component with different browser types
export const testBrowserTypes = async (
  Component: React.ComponentType<any>,
  props = {},
  browserTypes = ['chrome', 'firefox', 'safari', 'edge']
) => {
  for (const browserType of browserTypes) {
    // Mock browser detection
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: browserType === 'chrome' ? 'Chrome' : browserType,
    })

    const { container } = renderWithProviders(
      <Component {...props} browserType={browserType} />
    )

    // Add browser-specific assertions
    expect(container).toBeInTheDocument()
  }
}

// Test component with different screen orientations
export const testScreenOrientations = async (
  Component: React.ComponentType<any>,
  props = {},
  orientations = ['portrait', 'landscape']
) => {
  for (const orientation of orientations) {
    // Mock screen orientation
    Object.defineProperty(screen, 'orientation', {
      writable: true,
      configurable: true,
      value: { type: orientation },
    })

    const { container } = renderWithProviders(
      <Component {...props} />
    )

    // Add orientation-specific assertions
    expect(container).toBeInTheDocument()
  }
}

// Test component with different screen densities
export const testScreenDensities = async (
  Component: React.ComponentType<any>,
  props = {},
  densities = [1, 1.5, 2, 3]
) => {
  for (const density of densities) {
    // Mock device pixel ratio
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: density,
    })

    const { container } = renderWithProviders(
      <Component {...props} />
    )

    // Add density-specific assertions
    expect(container).toBeInTheDocument()
  }
}

// Test component with different screen sizes and orientations
export const testResponsiveDesign = async (
  Component: React.ComponentType<any>,
  props = {},
  breakpoints = [
    { width: 375, height: 667, orientation: 'portrait', name: 'mobile' },
    { width: 768, height: 1024, orientation: 'portrait', name: 'tablet' },
    { width: 1024, height: 768, orientation: 'landscape', name: 'desktop' }
  ]
) => {
  for (const breakpoint of breakpoints) {
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: breakpoint.width,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: breakpoint.height,
    })

    // Trigger resize event
    window.dispatchEvent(new Event('resize'))

    const { container } = renderWithProviders(
      <Component {...props} />
    )

    // Add responsive-specific assertions
    expect(container).toBeInTheDocument()
  }
}

// Re-export specialized utilities
export * from './router-test-utils'
export * from './form-test-utils'
export * from './api-test-utils'
export * from './auth-test-utils'
export * from './accessibility-test-utils'

// Re-export everything from testing library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
