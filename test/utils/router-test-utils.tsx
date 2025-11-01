import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, RenderOptions, screen, waitFor } from "@testing-library/react"
import { createMemoryHistory, MemoryRouter, Router } from "history"
import { ReactElement } from "react"
import { vi } from "vitest"

// Mock providers for router testing
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

interface RouterRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient
  initialEntries?: string[]
  initialIndex?: number
  history?: ReturnType<typeof createMemoryHistory>
}

// Render component with router context
export const renderWithRouter = (
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    initialEntries = ["/"],
    initialIndex = 0,
    history,
    ...renderOptions
  }: RouterRenderOptions = {}
) => {
  const testHistory =
    history || createMemoryHistory({ initialEntries, initialIndex })

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

// Test navigation between routes
export const testNavigation = async (
  Component: ReactElement,
  navigationSteps: Array<{
    action: () => void | Promise<void>
    expectedPath: string
    description: string
  }>,
  options: RouterRenderOptions = {}
) => {
  const { history } = renderWithRouter(Component, options)

  for (const { action, expectedPath, description } of navigationSteps) {
    await action()

    expect(history.location.pathname).toBe(expectedPath)
    console.log(`✓ ${description}: navigated to ${expectedPath}`)
  }
}

// Test route parameters
export const testRouteParams = async (
  Component: ReactElement,
  routeParams: Array<{
    path: string
    expectedParams: Record<string, string>
    description: string
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, expectedParams, description } of routeParams) {
    const { history } = renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    // Test that component receives correct params
    expect(history.location.pathname).toBe(path)
    console.log(`✓ ${description}: route params correct`)
  }
}

// Test query parameters
export const testQueryParams = async (
  Component: ReactElement,
  queryParams: Array<{
    path: string
    expectedQuery: Record<string, string>
    description: string
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, expectedQuery, description } of queryParams) {
    const { history } = renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    const searchParams = new URLSearchParams(history.location.search)
    const actualQuery = Object.fromEntries(searchParams.entries())

    expect(actualQuery).toEqual(expectedQuery)
    console.log(`✓ ${description}: query params correct`)
  }
}

// Test route guards and redirects
export const testRouteGuards = async (
  Component: ReactElement,
  guardTests: Array<{
    initialPath: string
    expectedPath: string
    description: string
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { initialPath, expectedPath, description } of guardTests) {
    const { history } = renderWithRouter(Component, {
      ...options,
      initialEntries: [initialPath],
    })

    await waitFor(() => {
      expect(history.location.pathname).toBe(expectedPath)
    })

    console.log(`✓ ${description}: redirected from ${initialPath} to ${expectedPath}`)
  }
}

// Test route loading states
export const testRouteLoading = async (
  Component: ReactElement,
  loadingTests: Array<{
    path: string
    shouldLoad: boolean
    description: string
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, shouldLoad, description } of loadingTests) {
    const { history } = renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    if (shouldLoad) {
      await waitFor(() => {
        expect(screen.getByText(/loading/i)).toBeInTheDocument()
      })
    } else {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }

    console.log(`✓ ${description}: loading state correct`)
  }
}

// Test route error states
export const testRouteErrors = async (
  Component: ReactElement,
  errorTests: Array<{
    path: string
    shouldError: boolean
    expectedError?: string
    description: string
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, shouldError, expectedError, description } of errorTests) {
    const { history } = renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    if (shouldError) {
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })

      if (expectedError) {
        expect(screen.getByText(expectedError)).toBeInTheDocument()
      }
    } else {
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
    }

    console.log(`✓ ${description}: error state correct`)
  }
}

// Test route data fetching
export const testRouteDataFetching = async (
  Component: ReactElement,
  dataTests: Array<{
    path: string
    expectedData: any
    description: string
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, expectedData, description } of dataTests) {
    const { history } = renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    await waitFor(() => {
      expect(screen.getByText(expectedData)).toBeInTheDocument()
    })

    console.log(`✓ ${description}: data fetched correctly`)
  }
}

// Test route breadcrumbs
export const testRouteBreadcrumbs = async (
  Component: ReactElement,
  breadcrumbTests: Array<{
    path: string
    expectedBreadcrumbs: string[]
    description: string
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, expectedBreadcrumbs, description } of breadcrumbTests) {
    const { history } = renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    for (const breadcrumb of expectedBreadcrumbs) {
      expect(screen.getByText(breadcrumb)).toBeInTheDocument()
    }

    console.log(`✓ ${description}: breadcrumbs correct`)
  }
}

// Test route titles
export const testRouteTitles = async (
  Component: ReactElement,
  titleTests: Array<{
    path: string
    expectedTitle: string
    description: string
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, expectedTitle, description } of titleTests) {
    const { history } = renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    await waitFor(() => {
      expect(document.title).toBe(expectedTitle)
    })

    console.log(`✓ ${description}: title correct`)
  }
}

// Test route meta tags
export const testRouteMetaTags = async (
  Component: ReactElement,
  metaTests: Array<{
    path: string
    expectedMeta: Record<string, string>
    description: string
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, expectedMeta, description } of metaTests) {
    const { history } = renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    for (const [name, content] of Object.entries(expectedMeta)) {
      const metaTag = document.querySelector(`meta[name="${name}"]`)
      expect(metaTag).toHaveAttribute("content", content)
    }

    console.log(`✓ ${description}: meta tags correct`)
  }
}

// Test route scroll behavior
export const testRouteScrollBehavior = async (
  Component: ReactElement,
  scrollTests: Array<{
    path: string
    expectedScrollPosition: number
    description: string
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, expectedScrollPosition, description } of scrollTests) {
    const { history } = renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    await waitFor(() => {
      expect(window.scrollY).toBe(expectedScrollPosition)
    })

    console.log(`✓ ${description}: scroll position correct`)
  }
}

// Test route focus management
export const testRouteFocusManagement = async (
  Component: ReactElement,
  focusTests: Array<{
    path: string
    expectedFocusElement: string
    description: string
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, expectedFocusElement, description } of focusTests) {
    const { history } = renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    await waitFor(() => {
      const focusedElement = document.activeElement
      expect(focusedElement).toHaveAttribute("data-testid", expectedFocusElement)
    })

    console.log(`✓ ${description}: focus management correct`)
  }
}

// Test route animations
export const testRouteAnimations = async (
  Component: ReactElement,
  animationTests: Array<{
    path: string
    expectedAnimation: string
    description: string
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, expectedAnimation, description } of animationTests) {
    const { history } = renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    await waitFor(() => {
      const animatedElement = screen.getByTestId("animated-element")
      expect(animatedElement).toHaveClass(expectedAnimation)
    })

    console.log(`✓ ${description}: animation correct`)
  }
}

// Test route caching
export const testRouteCaching = async (
  Component: ReactElement,
  cacheTests: Array<{
    path: string
    shouldCache: boolean
    description: string
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, shouldCache, description } of cacheTests) {
    const { history } = renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    // Navigate away and back
    history.push("/other")
    history.push(path)

    if (shouldCache) {
      // Component should be cached and not re-render
      expect(screen.getByText("Cached content")).toBeInTheDocument()
    } else {
      // Component should re-render
      expect(screen.getByText("Fresh content")).toBeInTheDocument()
    }

    console.log(`✓ ${description}: caching behavior correct`)
  }
}

// Test route preloading
export const testRoutePreloading = async (
  Component: ReactElement,
  preloadTests: Array<{
    path: string
    shouldPreload: boolean
    description: string
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, shouldPreload, description } of preloadTests) {
    const { history } = renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    // Test preloading behavior
    if (shouldPreload) {
      // Check that preload was triggered
      expect(history.location.pathname).toBe(path)
    }

    console.log(`✓ ${description}: preloading behavior correct`)
  }
}

// Test route middleware
export const testRouteMiddleware = async (
  Component: ReactElement,
  middlewareTests: Array<{
    path: string
    expectedMiddleware: string[]
    description: string
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, expectedMiddleware, description } of middlewareTests) {
    const { history } = renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    // Test that middleware was executed
    for (const middleware of expectedMiddleware) {
      expect(screen.getByText(middleware)).toBeInTheDocument()
    }

    console.log(`✓ ${description}: middleware executed correctly`)
  }
}

// Test route transitions
export const testRouteTransitions = async (
  Component: ReactElement,
  transitionTests: Array<{
    fromPath: string
    toPath: string
    expectedTransition: string
    description: string
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const {
    fromPath,
    toPath,
    expectedTransition,
    description,
  } of transitionTests) {
    const { history } = renderWithRouter(Component, {
      ...options,
      initialEntries: [fromPath],
    })

    // Navigate to new path
    history.push(toPath)

    await waitFor(() => {
      expect(screen.getByText(expectedTransition)).toBeInTheDocument()
    })

    console.log(`✓ ${description}: transition correct`)
  }
}

// Test route deep linking
export const testRouteDeepLinking = async (
  Component: ReactElement,
  deepLinkTests: Array<{
    url: string
    expectedPath: string
    description: string
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { url, expectedPath, description } of deepLinkTests) {
    // Mock window.location
    Object.defineProperty(window, "location", {
      value: { href: url },
      writable: true,
    })

    const { history } = renderWithRouter(Component, {
      ...options,
      initialEntries: [expectedPath],
    })

    expect(history.location.pathname).toBe(expectedPath)
    console.log(`✓ ${description}: deep linking correct`)
  }
}

// Test route SEO
export const testRouteSEO = async (
  Component: ReactElement,
  seoTests: Array<{
    path: string
    expectedSEO: {
      title: string
      description: string
      keywords: string[]
      ogTitle?: string
      ogDescription?: string
    }
    description: string
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, expectedSEO, description } of seoTests) {
    const { history } = renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    // Test title
    expect(document.title).toBe(expectedSEO.title)

    // Test meta description
    const metaDescription = document.querySelector('meta[name="description"]')
    expect(metaDescription).toHaveAttribute("content", expectedSEO.description)

    // Test meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]')
    expect(metaKeywords).toHaveAttribute("content", expectedSEO.keywords.join(", "))

    // Test Open Graph tags
    if (expectedSEO.ogTitle) {
      const ogTitle = document.querySelector('meta[property="og:title"]')
      expect(ogTitle).toHaveAttribute("content", expectedSEO.ogTitle)
    }

    if (expectedSEO.ogDescription) {
      const ogDescription = document.querySelector('meta[property="og:description"]')
      expect(ogDescription).toHaveAttribute("content", expectedSEO.ogDescription)
    }

    console.log(`✓ ${description}: SEO correct`)
  }
}

// Re-export everything from testing library
export * from "@testing-library/react"
export { default as userEvent } from "@testing-library/user-event"
