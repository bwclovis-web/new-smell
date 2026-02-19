/**
 * Yields to the main thread to break up long tasks and improve INP (Interaction to Next Paint).
 * Uses scheduler.yield() when available (Chrome origin trial), otherwise setTimeout(0).
 *
 * @see https://developer.chrome.com/blog/use-scheduler-yield
 * @see https://web.dev/articles/optimize-long-tasks
 */
export function yieldToMain(): Promise<void> {
  if (
    typeof globalThis.scheduler !== "undefined" &&
    typeof (globalThis.scheduler as { yield?: () => Promise<void> }).yield === "function"
  ) {
    return (globalThis.scheduler as { yield: () => Promise<void> }).yield()
  }
  return new Promise((resolve) => setTimeout(resolve, 0))
}
