import DOMPurify from "isomorphic-dompurify"

/**
 * Allowlist for review HTML (safe rich text only).
 * Used for both write-path sanitization and optional render-time sanitization.
 */
export const REVIEW_HTML_ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
] as const

const REVIEW_SANITIZE_CONFIG = {
  ALLOWED_TAGS: [...REVIEW_HTML_ALLOWED_TAGS],
  ALLOWED_ATTR: [] as string[],
}

/**
 * Sanitize HTML intended for review content (create/update and render).
 * Safe to use on server and client (isomorphic-dompurify).
 */
export function sanitizeReviewHtml(html: string): string {
  if (typeof html !== "string") return ""
  const result = DOMPurify.sanitize(html, REVIEW_SANITIZE_CONFIG)
  return typeof result === "string" ? result : String(result)
}
