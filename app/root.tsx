import "./app.css"

import { lazy, type ReactNode, Suspense } from "react"
import { I18nextProvider } from "react-i18next"
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router"

import type { Route } from "./+types/root"
import ImagePreloader from "./components/Atoms/ImagePreloader"
import { NonceProvider, useNonce } from "./hooks/use-nonce"
import i18n from "./modules/i18n/i18n.client"
import { QueryProvider } from "./providers/QueryProvider"

const FourOFourPage = lazy(() => import("./components/Containers/404Page/404Page"))
const ServiceWorkerRegistration = lazy(() => import("./components/Containers/ServiceWorkerRegistration"))
const CSRFTokenProvider = lazy(() =>
  import("./components/Molecules/CSRFToken").then(m => ({ default: m.CSRFTokenProvider }))
)

// Use self-hosted Limelight only (app/fonts.css). Do NOT add Google Fonts—they block render (~880ms).
export const links: Route.LinksFunction = () => [
  // Preload critical font for faster LCP (avoids render-blocking external font request)
  {
    rel: "preload",
    href: "/fonts/limelight-latin.woff2",
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  },
  // PWA manifest is added in entry.client.tsx after load to avoid critical request chain
]

export function Layout({ children }: { children: ReactNode }) {
  const nonce = useNonce()

  const criticalImages = [
    "/images/home.webp",
    "/images/scent.webp",
    "/images/perfume.webp",
    "/images/trading.webp",
    "/images/vault.webp",
    "/images/behind.webp",
  ]

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Discover and trade unique perfumes in our exclusive fragrance community"
        />
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="dark light" />

        {/* Performance and SEO meta tags */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Voodoo Perfumes" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Voodoo Perfumes" />
        <meta
          property="og:description"
          content="Discover and trade unique perfumes in our exclusive fragrance community"
        />

        {/* Font loading optimized - removed redundant preload */}

        {/* Always include Meta and Links first for CSS stability */}
        <Meta />
        <Links />
        {/* Defer link-card image preload until after LCP; hero preload is in home route links */}
        <ImagePreloader images={criticalImages} priority="low" lazy={false} />
      </head>
      <body className="bg-noir-black">
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <Suspense fallback={null}>
          <ServiceWorkerRegistration />
        </Suspense>
        <div id="modal-portal" />
      </body>
    </html>
  )
}

export default function App() {
  return (
    <NonceProvider value={undefined}>
      <I18nextProvider i18n={i18n}>
        <QueryProvider>
          <Suspense fallback={null}>
            <CSRFTokenProvider>
              <Outlet />
            </CSRFTokenProvider>
          </Suspense>
        </QueryProvider>
      </I18nextProvider>
    </NonceProvider>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-noir-dark" />}>
        <FourOFourPage />
      </Suspense>
    )
  }

  const message =
    error instanceof Error
      ? error.message
      : "An unexpected error occurred"

  const status = isRouteErrorResponse(error) ? error.status : undefined

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h1>
        {status && (
          <p className="text-sm text-gray-500 mb-2">Status: {status}</p>
        )}
        <p className="text-gray-600 mb-6">{message}</p>
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
      </div>
    </div>
  )
}
