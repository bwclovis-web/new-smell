import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { type ReactNode } from "react"

import { ClientOnly } from "~/components/ClientOnly"
import { queryClient } from "~/lib/queryClient"

interface QueryProviderProps {
  children: ReactNode
}

/**
 * QueryProvider wraps the application with TanStack Query's QueryClientProvider.
 * This enables React Query functionality throughout the app.
 * 
 * React Query DevTools are included in development mode only.
 */
export const QueryProvider = ({ children }: QueryProviderProps) => (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && (
        <ClientOnly>
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-left"
          />
        </ClientOnly>
      )}
    </QueryClientProvider>
  )

