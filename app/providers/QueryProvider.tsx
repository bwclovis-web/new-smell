import { useEffect, useState, type ReactNode } from "react"
import { QueryClientProvider } from "@tanstack/react-query"

import { queryClient } from "~/lib/queryClient"

interface QueryProviderProps {
  children: ReactNode
}

/**
 * DevTools component that safely loads React Query DevTools if available.
 * Install @tanstack/react-query-devtools to enable DevTools in development.
 */
function DevTools() {
  const [DevtoolsComponent, setDevtoolsComponent] =
    useState<React.ComponentType<any> | null>(null)

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return
    }

    // Dynamically import DevTools to avoid breaking if package isn't installed
    import("@tanstack/react-query-devtools")
      .then((module) => {
        setDevtoolsComponent(() => module.ReactQueryDevtools)
      })
      .catch(() => {
        // DevTools package not installed - silently continue
      })
  }, [])

  if (!import.meta.env.DEV || !DevtoolsComponent) {
    return null
  }

  return <DevtoolsComponent initialIsOpen={false} />
}

/**
 * QueryProvider wraps the application with TanStack Query's QueryClientProvider.
 * This enables React Query functionality throughout the app.
 * 
 * React Query DevTools are included in development mode only (if installed).
 * To enable DevTools, install: npm install -D @tanstack/react-query-devtools
 */
export const QueryProvider = ({ children }: QueryProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <DevTools />
    </QueryClientProvider>
  )
}

