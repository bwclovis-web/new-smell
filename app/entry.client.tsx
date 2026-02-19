import { startTransition, StrictMode } from "react"
import { hydrateRoot } from "react-dom/client"
import { HydratedRouter } from "react-router/dom"

import { yieldToMain } from "~/utils/yieldToMain"

// Add PWA manifest after load to keep it off the critical request chain
const addManifestLink = () => {
  if (document.querySelector('link[rel="manifest"]')) return
  const link = document.createElement("link")
  link.rel = "manifest"
  link.href = "/manifest.json"
  document.head.appendChild(link)
}
if (typeof requestIdleCallback !== "undefined") {
  requestIdleCallback(addManifestLink, { timeout: 500 })
} else {
  setTimeout(addManifestLink, 0)
}

// Yield before hydration to break long tasks and reduce main-thread blocking (Lighthouse)
;(async () => {
  await yieldToMain()
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <HydratedRouter />
      </StrictMode>
    )
  })
})()
