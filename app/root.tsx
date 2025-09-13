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
import PerformanceMonitor from './components/Atoms/PerformanceMonitor'
import ServiceWorkerRegistration from './components/Atoms/ServiceWorkerRegistration'
import FourOFourPage from './components/Containers/404Page/404Page'
import { NonceProvider, useNonce } from './hooks/use-nonce'
import i18n from './modules/i18n/i18n.client'
import { SessionProvider } from './providers/sessionProvider'

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
  { rel: 'manifest', href: '/manifest.json' },
  // Preload critical resources
  { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
  { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
  // Resource hints for better performance
  { rel: 'preload', href: '/images/home.webp', as: 'image', type: 'image/webp' },
  { rel: 'preload', href: '/images/scent.webp', as: 'image', type: 'image/webp' },
  // Preload critical fonts - removed problematic font file
  // Prefetch non-critical resources
  { rel: 'prefetch', href: '/images/login.webp' },
  { rel: 'prefetch', href: '/images/house.webp' },
  { rel: 'prefetch', href: '/images/perfume.webp' }
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

        {/* Preload critical fonts */}
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Limelight&display=swap" as="style" />

        <Meta />
        <Links />
        <ImagePreloader images={criticalImages} priority="high" />
      </head>
      <body className="bg-noir-black">
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <PerformanceMonitor />
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
        <SessionProvider>
          <Outlet />
        </SessionProvider>
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
