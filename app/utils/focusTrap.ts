/* eslint-disable no-unused-vars */

type FocusTrapFunction = (
  root: HTMLDivElement | HTMLUListElement | null,
  trigger: HTMLButtonElement | null,
  action: () => void
) => void

export const focusTrap: FocusTrapFunction = (root, trigger, action) => {
  const elements = root?.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  if (!elements || elements.length === 0) {
    return
  }
  const first = elements[0] as HTMLElement
  const last = elements[elements.length - 1] as HTMLElement

  root?.addEventListener("keydown", (evt: any) => {
    if (evt.key === "Escape") {
      action()
      trigger?.focus()
    }
    if (evt.key !== "Tab") {
      return
    }
    if (evt.shiftKey) {
      if (document.activeElement === first) {
        evt.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        evt.preventDefault()
        first.focus()
      }
    }
  })
  first.focus()
}
