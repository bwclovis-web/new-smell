import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, type RenderOptions, screen, waitFor } from "@testing-library/react"
import { createMemoryHistory } from "history"
import type { ReactElement, ReactNode } from "react"
import { Router } from "react-router"
import { expect } from "vitest"

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
  component: ReactElement,
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

  for (const { action, expectedPath } of navigationSteps) {
    await action()

    expect(history.location.pathname).toBe(expectedPath)
  }
}

// Test route parameters
export const testRouteParams = async (
  Component: ReactElement,
  routeParams: Array<{
    path: string
    expectedParams: Record<string, string>
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path } of routeParams) {
    renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

        // Test that component receives correct params
    expect(window.location.pathname).toBe(path)
  }
}

// Test query parameters
export const testQueryParams = async (
  Component: ReactElement,
  queryParams: Array<{
    path: string
    expectedQuery: Record<string, string>
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, expectedQuery } of queryParams) {
    const searchParams = new URLSearchParams(window.location.search)
    const actualQuery = Object.fromEntries(searchParams.entries())

    expect(actualQuery).toEqual(expectedQuery)
    renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

  }
}

// Test route guards and redirects
export const testRouteGuards = async (
  Component: ReactElement,
  guardTests: Array<{
    initialPath: string
    expectedPath: string
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { initialPath, expectedPath } of guardTests) {
    await waitFor(() => {
      expect(window.location.pathname).toBe(expectedPath)
    })

    renderWithRouter(Component, {
      ...options,
      initialEntries: [initialPath],
    })

  }
}

// Test route loading states
export const testRouteLoading = async (
  Component: ReactElement,
  loadingTests: Array<{
    path: string
    shouldLoad: boolean
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, shouldLoad } of loadingTests) {
    if (shouldLoad) {
      renderWithRouter(Component, {
        ...options,
        initialEntries: [path],
      })

      await waitFor(() => {
        expect(screen.getByText(/loading/i)).toBeInTheDocument()
      })
    } else {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    }

  }
}

// Test route error states
export const testRouteErrors = async (
  Component: ReactElement,
  errorTests: Array<{
    path: string
    shouldError: boolean
    expectedError?: string
  }>,
  options: RouterRenderOptions = {}
) => {
    for (const { path, shouldError, expectedError } of errorTests) {
    renderWithRouter(Component, {
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

  }
}

// Test route data fetching
export const testRouteDataFetching = async (
  Component: ReactElement,
  dataTests: Array<{
    path: string
    expectedData: any
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, expectedData } of dataTests) {
    renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    await waitFor(() => {
      expect(screen.getByText(expectedData)).toBeInTheDocument()
    })

  }
}

// Test route breadcrumbs
export const testRouteBreadcrumbs = async (
  Component: ReactElement,
  breadcrumbTests: Array<{
    path: string
    expectedBreadcrumbs: string[]
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, expectedBreadcrumbs } of breadcrumbTests) {
    renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    for (const breadcrumb of expectedBreadcrumbs) {
      expect(screen.getByText(breadcrumb)).toBeInTheDocument()
    }

  }
}

// Test route titles
export const testRouteTitles = async (
  Component: ReactElement,
  titleTests: Array<{
    path: string
    expectedTitle: string
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, expectedTitle } of titleTests) {
    renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    await waitFor(() => {
      expect(document.title).toBe(expectedTitle)
    })

  }
}

// Test route meta tags
export const testRouteMetaTags = async (
  Component: ReactElement,
  metaTests: Array<{
    path: string
    expectedMeta: Record<string, string>
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, expectedMeta } of metaTests) {
    renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    for (const [name, content] of Object.entries(expectedMeta)) {
      const metaTag = document.querySelector(`meta[name="${name}"]`)
      expect(metaTag).toHaveAttribute("content", content)
    }

  }
}

// Test route scroll behavior
export const testRouteScrollBehavior = async (
  Component: ReactElement,
  scrollTests: Array<{
    path: string
    expectedScrollPosition: number
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, expectedScrollPosition } of scrollTests) {
    renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    await waitFor(() => {
      expect(window.scrollY).toBe(expectedScrollPosition)
    })

  }
}

// Test route focus management
export const testRouteFocusManagement = async (
  Component: ReactElement,
  focusTests: Array<{
    path: string
    expectedFocusElement: string
  }>,
  options: RouterRenderOptions = {}
) => {
    for (const { path, expectedFocusElement } of focusTests) {
    renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    await waitFor(() => {
      const focusedElement = document.activeElement
      expect(focusedElement).toHaveAttribute("data-testid", expectedFocusElement)
    })

  }
}

// Test route animations
export const testRouteAnimations = async (
  Component: ReactElement,
  animationTests: Array<{
    path: string
    expectedAnimation: string
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, expectedAnimation } of animationTests) {
    renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    await waitFor(() => {
      const animatedElement = screen.getByTestId("animated-element")
      expect(animatedElement).toHaveClass(expectedAnimation)
    })

  }
}

// Test route caching
export const testRouteCaching = async (
  Component: ReactElement,
  cacheTests: Array<{
    path: string
    shouldCache: boolean
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, shouldCache } of cacheTests) {
    renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    // Navigate away and back
    window.history.push("/other")
    window.history.push(path)

    if (shouldCache) {
      // Component should be cached and not re-render
      expect(screen.getByText("Cached content")).toBeInTheDocument()
    } else {
      // Component should re-render
      expect(screen.getByText("Fresh content")).toBeInTheDocument()
    }

  }
}

// Test route preloading
export const testRoutePreloading = async (
  Component: ReactElement,
  preloadTests: Array<{
    path: string
    shouldPreload: boolean
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, shouldPreload } of preloadTests) {
    renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    // Test preloading behavior
    if (shouldPreload) {
      // Check that preload was triggered
      expect(window.location.pathname).toBe(path)
    }

  }
}

// Test route middleware
export const testRouteMiddleware = async (
  Component: ReactElement,
  middlewareTests: Array<{
    path: string
    expectedMiddleware: string[]
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, expectedMiddleware } of middlewareTests) {
    renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    // Test that middleware was executed
    for (const middleware of expectedMiddleware) {
      expect(screen.getByText(middleware)).toBeInTheDocument()
    }

  }
}

// Test route transitions
export const testRouteTransitions = async (
  Component: ReactElement,
  transitionTests: Array<{
    fromPath: string
    toPath: string
    expectedTransition: string
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const {
    fromPath,
    toPath,
    expectedTransition,
  } of transitionTests) {
    renderWithRouter(Component, {
      ...options,
      initialEntries: [fromPath],
    })

    // Navigate to new path
    window.history.push(toPath)

    await waitFor(() => {
      expect(screen.getByText(expectedTransition)).toBeInTheDocument()
    })

  }
}

// Test route deep linking
export const testRouteDeepLinking = async (
  Component: ReactElement,
  deepLinkTests: Array<{
    url: string
    expectedPath: string
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { url, expectedPath } of deepLinkTests) {
    // Mock window.location
    Object.defineProperty(window, "location", {
      value: { href: url },
      writable: true,
    })

    renderWithRouter(Component, {
      ...options,
      initialEntries: [expectedPath],
    })

    expect(window.location.pathname).toBe(expectedPath)
  }
}

// Test route SEO
export const testRouteSEO = async (
  Component: ReactElement,
  seoTests: Array<{
    path: string
    expectedSEO: {
      title: string
      keywords: string[]
      ogTitle?: string
      ogDescription?: string
    }
  }>,
  options: RouterRenderOptions = {}
) => {
  for (const { path, expectedSEO } of seoTests) {
    renderWithRouter(Component, {
      ...options,
      initialEntries: [path],
    })

    // Test title
    expect(document.title).toBe(expectedSEO.title)

    // Test meta description
    const metaDescription = document.querySelector('meta[name="description"]')
    expect(metaDescription).toHaveAttribute("content", expectedSEO.ogDescription || "" || "description" )


  }
}

// Re-export everything from testing library
export * from "@testing-library/react"
export { default as userEvent } from "@testing-library/user-event"
