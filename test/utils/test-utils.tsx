import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory } from 'history'
import { type ReactElement, type ReactNode } from 'react'
import { MemoryRouter, Router } from 'react-router-dom'
import { expect, vi } from 'vitest'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
  initialEntries?: string[]
  initialIndex?: number
  history?: ReturnType<typeof createMemoryHistory>
  route?: string
}

interface MockUser {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

interface MockPerfume {
  id: string
  name: string
  brand: string
  description: string
  price: number
  size: string
  createdAt: string
  updatedAt: string
}

interface MockHouse {
  id: string
  name: string
  description: string
  website: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// QUERY CLIENT SETUP
// ============================================================================

const createTestQueryClient = () => new QueryClient({
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

// ============================================================================
// RENDER UTILITIES
// ============================================================================

export const renderWithProviders = (
  component: ReactElement,
  {
    queryClient = createTestQueryClient(),
    initialEntries = ['/'],
    initialIndex = 0,
    history,
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  const testHistory = history || createMemoryHistory({
    initialEntries,
    initialIndex
  })

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <Router location={testHistory.location} navigator={testHistory}>
        {children}
      </Router>
    </QueryClientProvider>
  )

  return {
    ...render(component, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
    history: testHistory,
  }
}

export const renderWithMemoryRouter = (
  component: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialEntries = ['/'], ...renderOptions } = options

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider
      client={options.queryClient || createTestQueryClient()}
    >
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  )

  return {
    ...render(component, { wrapper: Wrapper, ...renderOptions }),
    queryClient: options.queryClient || createTestQueryClient(),
  }
}

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockPerfume = (overrides: Partial<MockPerfume> = {}): MockPerfume => ({
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

export const createMockHouse = (overrides: Partial<MockHouse> = {}): MockHouse => ({
  id: '1',
  name: 'Test House',
  description: 'Test house description',
  website: 'https://test.com',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

// ============================================================================
// MOCK FUNCTIONS
// ============================================================================

export const mockFetch = (data: any, status = 200) => vi.fn().mockResolvedValue({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
})

export const mockFetchError = (message = 'Network error') => vi.fn().mockRejectedValue(new Error(message))

// Generic storage mock factory
const createStorageMock = () => {
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
      Object.keys(store).forEach(key => {
        delete store[key]
      })
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  }
}

export const mockLocalStorage = createStorageMock
export const mockSessionStorage = createStorageMock

// ============================================================================
// BROWSER API MOCKS
// ============================================================================

export const mockIntersectionObserver = () => {
  const mockObserver = vi.fn()
  mockObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })
  window.IntersectionObserver = mockObserver
  return mockObserver
}

export const mockResizeObserver = () => {
  const mockObserver = vi.fn()
  mockObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })
  window.ResizeObserver = mockObserver
  return mockObserver
}

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

export const mockScrollTo = () => {
  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: vi.fn(),
  })
}

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

export const createTestData = {
  users: (count: number) => Array.from({ length: count }, (_, i) => createMockUser({ id: `${i + 1}` })),
  perfumes: (count: number) => Array.from({ length: count }, (_, i) => createMockPerfume({ id: `${i + 1}` })),
  houses: (count: number) => Array.from({ length: count }, (_, i) => createMockHouse({ id: `${i + 1}` })),
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const wait = (milliseconds: number) => new Promise(resolve => {
  setTimeout(resolve, milliseconds)
})

export const createTestUser = () => userEvent.setup()

export const waitForElement = async (selector: string, timeout = 5000) => waitFor(() => screen.getByTestId(selector), { timeout })

export const waitForElementToDisappear = async (
  selector: string,
  timeout = 5000
) => waitFor(() => {
  expect(screen.queryByTestId(selector)).not.toBeInTheDocument()
}, { timeout })

// ============================================================================
// CUSTOM MATCHERS
// ============================================================================

export const customMatchers = {
  toBeInTheDocument: (received: any) => {
    const pass = received &&
      received.ownerDocument &&
      received.ownerDocument.body.contains(received)
    return {
      pass,
      message: () => `expected element ${pass ? 'not ' : ''}to be in the document`,
    }
  },

  toHaveClass: (received: any, className: string) => {
    const pass = received &&
      received.classList &&
      received.classList.contains(className)
    return {
      pass,
      message: () => `expected element ${pass ? 'not ' : ''}to have class "${className}"`,
    }
  },

  toHaveAttribute: (received: any, attribute: string, value?: string) => {
    const hasAttribute = received &&
      received.hasAttribute &&
      received.hasAttribute(attribute)
    const hasValue = value ?
      received && received.getAttribute(attribute) === value : true
    const pass = hasAttribute && hasValue
    return {
      pass,
      message: () => `expected element ${pass ? 'not ' : ''}to have attribute "${attribute}"${value ? ` with value "${value}"` : ''}`,
    }
  },
}

// ============================================================================
// SIMPLIFIED TESTING UTILITIES
// ============================================================================

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

export const testErrorBoundary = async (
  Component: React.ComponentType<any>,
  errorProps: any
) => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
    // Mock implementation
  })

  renderWithProviders(<Component {...errorProps} />)

  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument()
  })

  consoleSpy.mockRestore()
}

export const testAccessibility = async (
  Component: React.ComponentType<any>,
  props = {}
) => {
  const { container } = renderWithProviders(<Component {...props} />)

  // Test for basic accessibility attributes
  const elements = container.querySelectorAll('[role], [aria-label], [aria-labelledby]')
  expect(elements.length).toBeGreaterThan(0)

  // Test for keyboard navigation
  const focusableElements = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
  expect(focusableElements.length).toBeGreaterThan(0)
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

// Re-export everything from testing library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
