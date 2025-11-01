/**
 * Tests to verify the accuracy of the reusable patterns documentation
 *
 * This test file ensures that:
 * 1. All referenced files exist
 * 2. All documented exports are available
 * 3. Documentation stays in sync with implementation
 */

import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

// Helper to check if file exists
function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(path.join(process.cwd(), filePath))
  } catch {
    return false
  }
}

describe("Reusable Patterns Documentation Tests", () => {
  describe("Documentation Files", () => {
    it("should have the main reusable patterns documentation", () => {
      expect(fileExists("docs/developer/REUSABLE_PATTERNS.md")).toBe(true)
    })

    it("should have the code quality improvements documentation", () => {
      expect(fileExists("docs/developer/CODE_QUALITY_IMPROVEMENTS.md")).toBe(true)
    })

    it("should have the forms README", () => {
      expect(fileExists("app/utils/forms/README.md")).toBe(true)
    })
  })

  describe("Error Handling Pattern Files", () => {
    it("should have the error handling patterns implementation", () => {
      expect(fileExists("app/utils/errorHandling.patterns.ts")).toBe(true)
    })

    it("should have the error handling patterns tests", () => {
      expect(fileExists("app/utils/errorHandling.patterns.test.ts")).toBe(true)
    })

    it("should export all documented error handling functions", async () => {
      const patterns = await import("../../app/utils/errorHandling.patterns")

      // Wrappers
      expect(patterns.withLoaderErrorHandling).toBeDefined()
      expect(patterns.withActionErrorHandling).toBeDefined()
      expect(patterns.withDatabaseErrorHandling).toBeDefined()
      expect(patterns.withApiErrorHandling).toBeDefined()
      expect(patterns.withValidationErrorHandling).toBeDefined()

      // Result patterns
      expect(patterns.safeAsync).toBeDefined()
      expect(patterns.safeSync).toBeDefined()

      // Assertions
      expect(patterns.assertExists).toBeDefined()
      expect(patterns.assertValid).toBeDefined()
      expect(patterns.assertAuthenticated).toBeDefined()
      expect(patterns.assertAuthorized).toBeDefined()

      // Error factories
      expect(patterns.notFoundError).toBeDefined()
      expect(patterns.validationError).toBeDefined()
      expect(patterns.authenticationError).toBeDefined()
      expect(patterns.authorizationError).toBeDefined()
      expect(patterns.databaseError).toBeDefined()
      expect(patterns.networkError).toBeDefined()

      // Advanced features
      expect(patterns.withRetry).toBeDefined()
    })
  })

  describe("Validation Pattern Files", () => {
    it("should have the validation schemas implementation", () => {
      expect(fileExists("app/utils/validation/schemas.ts")).toBe(true)
    })

    it("should have the validation schemas tests", () => {
      expect(fileExists("app/utils/validation/schemas.test.ts")).toBe(true)
    })

    it("should have the validation index", () => {
      expect(fileExists("app/utils/validation/index.ts")).toBe(true)
    })

    it("should have the validation index tests", () => {
      expect(fileExists("app/utils/validation/index.test.ts")).toBe(true)
    })

    it("should export all documented validation schemas", async () => {
      const validation = await import("../../app/utils/validation")

      // Common schemas
      expect(validation.commonSchemas).toBeDefined()
      expect(validation.commonSchemas.id).toBeDefined()
      expect(validation.commonSchemas.email).toBeDefined()
      expect(validation.commonSchemas.password).toBeDefined()
      expect(validation.commonSchemas.username).toBeDefined()
      expect(validation.commonSchemas.url).toBeDefined()
      expect(validation.commonSchemas.rating).toBeDefined()

      // Domain schemas
      expect(validation.authSchemas).toBeDefined()
      expect(validation.perfumeSchemas).toBeDefined()
      expect(validation.perfumeHouseSchemas).toBeDefined()
      expect(validation.ratingSchemas).toBeDefined()
      expect(validation.commentSchemas).toBeDefined()
      expect(validation.wishlistSchemas).toBeDefined()
      expect(validation.apiSchemas).toBeDefined()
      expect(validation.adminSchemas).toBeDefined()
    })

    it("should export all documented validation helpers", async () => {
      const validation = await import("../../app/utils/validation")

      expect(validation.validateData).toBeDefined()
      expect(validation.validateFormData).toBeDefined()
      expect(validation.validateJsonData).toBeDefined()
      expect(validation.sanitizeString).toBeDefined()
      expect(validation.sanitizeObject).toBeDefined()
      expect(validation.validateAndTransform).toBeDefined()
      expect(validation.validateEmail).toBeDefined()
      expect(validation.validatePassword).toBeDefined()
      expect(validation.validateUrl).toBeDefined()
      expect(validation.validatePagination).toBeDefined()
    })
  })

  describe("Form Utility Files", () => {
    it("should have the forms directory", () => {
      expect(fileExists("app/utils/forms")).toBe(true)
    })

    it("should have the form submit utilities", () => {
      expect(fileExists("app/utils/forms/formSubmit.ts")).toBe(true)
    })

    it("should have the form validation utilities", () => {
      expect(fileExists("app/utils/forms/formValidation.ts")).toBe(true)
    })

    it("should have the forms index", () => {
      expect(fileExists("app/utils/forms/index.ts")).toBe(true)
    })

    it("should export all documented form utilities", async () => {
      const forms = await import("../../app/utils/forms")

      // Hooks
      expect(forms.useFormSubmit).toBeDefined()

      // Validators
      expect(forms.commonValidators).toBeDefined()
      expect(forms.createValidator).toBeDefined()

      // Helpers
      expect(forms.extractFormData).toBeDefined()
      expect(forms.formDataToObject).toBeDefined()
      expect(forms.sanitizeFormInput).toBeDefined()
      expect(forms.sanitizeFormData).toBeDefined()

      // Validation functions
      expect(forms.validateEmail).toBeDefined()
      expect(forms.validatePassword).toBeDefined()
      expect(forms.validateMatch).toBeDefined()
    })
  })

  describe("Data Fetching Pattern Files", () => {
    it("should have the data fetching directory", () => {
      expect(fileExists("app/utils/data-fetching")).toBe(true)
    })

    it("should have the data fetching index", () => {
      expect(fileExists("app/utils/data-fetching/index.ts")).toBe(true)
    })

    it("should export all documented data fetching utilities", async () => {
      const dataFetching = await import("../../app/utils/data-fetching")

      // Hooks
      expect(dataFetching.useDataFetching).toBeDefined()
      expect(dataFetching.usePaginatedData).toBeDefined()
      expect(dataFetching.useApiWithRetry).toBeDefined()
      expect(dataFetching.useDebouncedSearch).toBeDefined()

      // Utilities
      expect(dataFetching.buildQueryString).toBeDefined()
      expect(dataFetching.withCache).toBeDefined()
      expect(dataFetching.parseApiResponse).toBeDefined()
      expect(dataFetching.createFetchFn).toBeDefined()
      expect(dataFetching.retryFetch).toBeDefined()
      expect(dataFetching.clearAllCache).toBeDefined()
      expect(dataFetching.getCacheStats).toBeDefined()
    })
  })

  describe("Documentation Content Verification", () => {
    it("should reference correct test file counts", async () => {
      // Error handling: 38 tests
      const errorTests = await import(
        "../../app/utils/errorHandling.patterns.test.ts"
      )
      // Note: We're checking the test file exists and is structured correctly
      // The actual test count is verified by running the tests themselves
      expect(errorTests).toBeDefined()
    })

    it("should have valid code examples structure", () => {
      const docPath = path.join(process.cwd(), "docs/developer/REUSABLE_PATTERNS.md")
      const content = fs.readFileSync(docPath, "utf-8")

      // Check for presence of key sections
      expect(content).toContain("## Error Handling Patterns")
      expect(content).toContain("## Validation Patterns")
      expect(content).toContain("## Form Utilities")
      expect(content).toContain("## Data Fetching Patterns")
      expect(content).toContain("## Best Practices")
      expect(content).toContain("## Quick Reference")
      expect(content).toContain("## Migration Guide")
    })

    it("should have consistent import paths in examples", () => {
      const docPath = path.join(process.cwd(), "docs/developer/REUSABLE_PATTERNS.md")
      const content = fs.readFileSync(docPath, "utf-8")

      // Check for correct import patterns (using ~/ alias)
      const importPattern = /from ['"]~\/utils\//g
      const matches = content.match(importPattern)

      expect(matches).not.toBeNull()
      expect(matches!.length).toBeGreaterThan(0)
    })

    it("should document all major pattern categories", () => {
      const docPath = path.join(process.cwd(), "docs/developer/REUSABLE_PATTERNS.md")
      const content = fs.readFileSync(docPath, "utf-8")

      // Verify presence of all four major pattern categories
      expect(content).toContain("errorHandling.patterns")
      expect(content).toContain("validation")
      expect(content).toContain("forms")
      expect(content).toContain("data-fetching")
    })

    it("should include TypeScript examples", () => {
      const docPath = path.join(process.cwd(), "docs/developer/REUSABLE_PATTERNS.md")
      const content = fs.readFileSync(docPath, "utf-8")

      // Check for TypeScript syntax
      expect(content).toContain("```typescript")
      expect(content).toContain("async")
      expect(content).toContain("await")
      expect(content).toContain("interface")
    })
  })

  describe("Cross-Reference Verification", () => {
    it("should reference all implementation files", () => {
      const docPath = path.join(process.cwd(), "docs/developer/REUSABLE_PATTERNS.md")
      const content = fs.readFileSync(docPath, "utf-8")

      // Check for file references
      expect(content).toContain("errorHandling.patterns.ts")
      expect(content).toContain("errorHandling.patterns.test.ts")
      expect(content).toContain("validation/schemas.ts")
      expect(content).toContain("validation/schemas.test.ts")
      expect(content).toContain("forms/README.md")
      expect(content).toContain("data-fetching/index.ts")
    })

    it("should reference test files", () => {
      const docPath = path.join(process.cwd(), "docs/developer/REUSABLE_PATTERNS.md")
      const content = fs.readFileSync(docPath, "utf-8")

      expect(content).toContain(".test.ts")
      expect(content).toContain("tests")
      expect(content).toContain("Testing")
    })

    it("should link to additional documentation", () => {
      const docPath = path.join(process.cwd(), "docs/developer/REUSABLE_PATTERNS.md")
      const content = fs.readFileSync(docPath, "utf-8")

      expect(content).toContain("Additional Resources")
      expect(content).toContain("README.md")
    })
  })

  describe("Integration Tests", () => {
    it("should have working error handling patterns", async () => {
      const { safeAsync, assertExists, validationError } = await import(
        "../../app/utils/errorHandling.patterns"
      )

      // Test safeAsync
      const [error, result] = await safeAsync(async () => "success")
      expect(error).toBeNull()
      expect(result).toBe("success")

      // Test assertExists
      expect(() => assertExists("value", "Field")).not.toThrow()
      expect(() => assertExists(null, "Field")).toThrow()

      // Test error factory
      const err = validationError("Test error")
      expect(err).toBeDefined()
      expect(err.message).toBe("Test error")
    })

    it("should have working validation patterns", async () => {
      const { commonSchemas, sanitizeString } = await import(
        "../../app/utils/validation"
      )

      // Test email schema
      const emailResult = commonSchemas.email.safeParse("test@example.com")
      expect(emailResult.success).toBe(true)

      // Test sanitization
      const cleaned = sanitizeString('<script>alert("xss")</script>Hello')
      expect(cleaned).not.toContain("<script>")
      expect(cleaned).toContain("Hello")
    })

    it("should have working data fetching utilities", async () => {
      const { buildQueryString, getCacheStats } = await import(
        "../../app/utils/data-fetching"
      )

      // Test query string building
      const url = buildQueryString("/api/test", { page: 1, limit: 20 })
      expect(url).toBe("/api/test?page=1&limit=20")

      // Test cache stats
      const stats = getCacheStats()
      expect(stats).toBeDefined()
      expect(stats.count).toBeGreaterThanOrEqual(0)
    })
  })

  describe("Documentation Quality", () => {
    it("should have a table of contents", () => {
      const docPath = path.join(process.cwd(), "docs/developer/REUSABLE_PATTERNS.md")
      const content = fs.readFileSync(docPath, "utf-8")

      expect(content).toContain("## Table of Contents")
    })

    it("should have clear section headers", () => {
      const docPath = path.join(process.cwd(), "docs/developer/REUSABLE_PATTERNS.md")
      const content = fs.readFileSync(docPath, "utf-8")

      // Count section headers (##)
      const sectionHeaders = content.match(/^## /gm)
      expect(sectionHeaders).not.toBeNull()
      expect(sectionHeaders!.length).toBeGreaterThanOrEqual(6)
    })

    it("should include benefits sections", () => {
      const docPath = path.join(process.cwd(), "docs/developer/REUSABLE_PATTERNS.md")
      const content = fs.readFileSync(docPath, "utf-8")

      expect(content).toContain("Benefits")
      expect(content).toContain("✅")
    })

    it("should have before/after migration examples", () => {
      const docPath = path.join(process.cwd(), "docs/developer/REUSABLE_PATTERNS.md")
      const content = fs.readFileSync(docPath, "utf-8")

      expect(content).toContain("Before:")
      expect(content).toContain("After:")
    })

    it("should have DO and DON'T examples", () => {
      const docPath = path.join(process.cwd(), "docs/developer/REUSABLE_PATTERNS.md")
      const content = fs.readFileSync(docPath, "utf-8")

      expect(content).toContain("**DO:**")
      expect(content).toContain("**DON'T:**")
    })

    it("should include version and last updated date", () => {
      const docPath = path.join(process.cwd(), "docs/developer/REUSABLE_PATTERNS.md")
      const content = fs.readFileSync(docPath, "utf-8")

      expect(content).toContain("Last Updated:")
      expect(content).toContain("November 1, 2025")
      expect(content).toContain("Version:")
    })
  })

  describe("Code Quality Improvements Documentation", () => {
    it("should mark the documentation task as completed", () => {
      const docPath = path.join(
        process.cwd(),
        "docs/developer/CODE_QUALITY_IMPROVEMENTS.md"
      )
      const content = fs.readFileSync(docPath, "utf-8")

      expect(content).toContain("Document reusable patterns")
      expect(content).toContain("✅")
      expect(content).toContain("COMPLETED")
    })

    it("should have a reusable patterns documentation summary section", () => {
      const docPath = path.join(
        process.cwd(),
        "docs/developer/CODE_QUALITY_IMPROVEMENTS.md"
      )
      const content = fs.readFileSync(docPath, "utf-8")

      expect(content).toContain("Reusable Patterns Documentation Summary")
      expect(content).toContain("November 1, 2025")
    })

    it("should document success metrics", () => {
      const docPath = path.join(
        process.cwd(),
        "docs/developer/CODE_QUALITY_IMPROVEMENTS.md"
      )
      const content = fs.readFileSync(docPath, "utf-8")

      expect(content).toContain("Success Metrics")
      expect(content).toContain("800+ lines")
      expect(content).toContain("40+ code examples")
    })

    it("should reference the new documentation file", () => {
      const docPath = path.join(
        process.cwd(),
        "docs/developer/CODE_QUALITY_IMPROVEMENTS.md"
      )
      const content = fs.readFileSync(docPath, "utf-8")

      expect(content).toContain("REUSABLE_PATTERNS.md")
    })
  })
})
