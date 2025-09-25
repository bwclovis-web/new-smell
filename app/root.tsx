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
import ImagePreloader from './components/Atoms/ImagePreloader'
import FourOFourPage from './components/Containers/404Page/404Page'
import ErrorBoundaryComponent from './components/Containers/ErrorBoundary'
import ServiceWorkerRegistration from './components/Containers/ServiceWorkerRegistration'
import { CSRFTokenProvider } from './components/Molecules/CSRFToken'
import { NonceProvider, useNonce } from './hooks/use-nonce'
import i18n from './modules/i18n/i18n.client'
import { SessionProvider } from './providers/sessionProvider'
import { AppError } from './utils/errorHandling'

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
  },
  // PWA manifest
  { rel: 'manifest', href: '/manifest.json' }
]

export function Layout({ children }: { children: ReactNode }) {
  const nonce = useNonce()

  // Critical images to preload
  const criticalImages = [
    '/images/home.webp',
    '/images/scent.webp',
    '/images/login.webp'
  ]

  return (
    <html lang="en" >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Discover and trade unique perfumes in our exclusive fragrance community" />
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="dark light" />

        {/* Performance and SEO meta tags */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Voodoo Perfumes" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Voodoo Perfumes" />
        <meta property="og:description" content="Discover and trade unique perfumes in our exclusive fragrance community" />

        {/* Font loading optimized - removed redundant preload */}

        <Meta />
        <Links />
        <ImagePreloader images={criticalImages} priority="high" />
      </head>
      <body className="bg-noir-black">
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <ServiceWorkerRegistration />
        <div id="modal-portal" />
      </body>
    </html>
  )
}

export default function App() {
  return (
    <NonceProvider value={undefined}>
      <I18nextProvider i18n={i18n}>
        <CSRFTokenProvider>
          <SessionProvider>
            <Outlet />
          </SessionProvider>
        </CSRFTokenProvider>
      </I18nextProvider>
    </NonceProvider>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  // Handle 404 errors with custom page
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <FourOFourPage />
  }

  // Use our centralized error handling for other errors
  const appError = error instanceof Error
    ? new AppError(error.message, 'UNKNOWN' as any, 'MEDIUM' as any, 'ROUTE_ERROR', undefined, {
      status: isRouteErrorResponse(error) ? error.status : undefined,
      statusText: isRouteErrorResponse(error) ? error.statusText : undefined,
      stack: error.stack
    })
    : new AppError('An unexpected error occurred', 'UNKNOWN' as any, 'MEDIUM' as any, 'ROUTE_ERROR')

  return (
    <ErrorBoundaryComponent level="page" fallback={(error: any, errorId: string) => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600">{error.userMessage}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Go Back
            </button>
          </div>

          {import.meta.env.DEV && (
            <details className="mt-4 text-left">
              <summary className="text-sm text-gray-500 cursor-pointer">Developer Details</summary>
              <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(error.toJSON(), null, 2)}
              </pre>
            </details>
          )}

          <p className="text-xs text-gray-500 mt-4 text-center">Error ID: {errorId}</p>
        </div>
      </div>
    )}>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600">{appError.userMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </ErrorBoundaryComponent>
  )
}
