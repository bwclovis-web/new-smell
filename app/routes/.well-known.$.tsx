import type { LoaderFunctionArgs } from "react-router"

/**
 * Handles requests to /.well-known/* paths (e.g., Chrome DevTools requests)
 * Returns a 404 response to gracefully handle these automatic browser requests
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Return a 404 response for all .well-known paths
  // This handles requests like /.well-known/appspecific/com.chrome.devtools.json
  return new Response(null, {
    status: 404,
    headers: {
      "Content-Type": "text/plain",
    },
  })
}

