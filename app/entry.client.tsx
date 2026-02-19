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

// Break up main-thread "Other" time: yield → rAF → yield → hydrate
;(async () => {
  await yieldToMain()
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
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
