/**
 * Sanitize utilities tests – ensure script and dangerous tags never persist.
 */

import { describe, expect, it } from "vitest"

import { containsDangerousReviewHtml, sanitizeReviewHtml } from "./sanitize"

describe("sanitizeReviewHtml", () => {
  it("strips script tags entirely", () => {
    expect(sanitizeReviewHtml('<script>alert(1)</script>')).not.toContain("script")
    expect(sanitizeReviewHtml('<script>alert(1)</script>')).not.toContain("alert")
    expect(sanitizeReviewHtml('<script src="evil.js"></script>')).not.toContain("script")
  })

  it("strips script when mixed with allowed content", () => {
    const result = sanitizeReviewHtml("<p>Hello</p><script>alert(1)</script><p>World</p>")
    expect(result).not.toContain("script")
    expect(result).not.toContain("alert")
    expect(result).toContain("Hello")
    expect(result).toContain("World")
  })

  it("allows safe tags only", () => {
    expect(sanitizeReviewHtml("<p><strong>bold</strong></p>")).toContain("<p>")
    expect(sanitizeReviewHtml("<p><strong>bold</strong></p>")).toContain("<strong>")
    expect(sanitizeReviewHtml("<ul><li>a</li></ul>")).toContain("<ul>")
  })

  it("returns empty string for non-string input", () => {
    expect(sanitizeReviewHtml((null as unknown) as string)).toBe("")
    expect(sanitizeReviewHtml((undefined as unknown) as string)).toBe("")
  })
})

describe("containsDangerousReviewHtml", () => {
  it("detects raw and encoded script tags", () => {
    expect(containsDangerousReviewHtml("<script>alert(1)</script>")).toBe(true)
    expect(containsDangerousReviewHtml("&lt;script&gt;")).toBe(true)
    expect(containsDangerousReviewHtml("&#60;script&#62;")).toBe(true)
    expect(containsDangerousReviewHtml("&#x3c;script&#x3e;")).toBe(true)
    expect(containsDangerousReviewHtml("%3Cscript%3E")).toBe(true)
  })
})
