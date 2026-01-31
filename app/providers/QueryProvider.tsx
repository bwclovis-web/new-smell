import { QueryClientProvider } from "@tanstack/react-query"
import { lazy, Suspense, type ReactNode } from "react"

import { ClientOnly } from "~/components/ClientOnly"
import { queryClient } from "~/lib/queryClient"

// Lazy load devtools to reduce initial bundle size
const ReactQueryDevtools = lazy(() =>
  import("@tanstack/react-query-devtools").then((module) => ({
    default: module.ReactQueryDevtools,
  }))
)

interface QueryProviderProps {
  children: ReactNode
}

/**
 * QueryProvider wraps the application with TanStack Query's QueryClientProvider.
 * This enables React Query functionality throughout the app.
 * 
 * React Query DevTools are lazy loaded in development mode only to reduce bundle size.
 */
export const QueryProvider = ({ children }: QueryProviderProps) => (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && (
        <ClientOnly>
          <Suspense fallback={null}>
            <ReactQueryDevtools
              initialIsOpen={false}
              buttonPosition="bottom-left"
            />
          </Suspense>
        </ClientOnly>
      )}
    </QueryClientProvider>
  )

