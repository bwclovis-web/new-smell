import './app.css'

import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration
} from 'react-router'

import type { Route } from './+types/root'
import FourOFourPage from './components/Containers/404Page/404Page'
import { NonceProvider, useNonce } from './hooks/use-nonce'
import i18n from './modules/i18n/i18n.client'

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous'
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Limelight&display=swap'
  }
]

export function Layout({ children }: { children: ReactNode }) {
  const nonce = useNonce()
  return (
    <html lang="en" >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className=' bg-noir-light text-noir-dark dark:bg-noir-dark dark:text-noir-light'>
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  )
}

export default function App() {
  // On the client side, nonce is typically not needed for CSP as scripts are already loaded
  // But we provide an empty context for consistency
  return (
    <NonceProvider value={undefined}>
      <I18nextProvider i18n={i18n}>
        <Outlet />
      </I18nextProvider>
    </NonceProvider>
  )
}

// TODO: Refactor per error
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details
      = error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details
    if (error.status === 404) {
      return <FourOFourPage />
    }
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
