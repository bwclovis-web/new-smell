/**
 * Perfume Loader API Integration Tests
 *
 * Tests the perfume search API loader functionality:
 * - Search by perfume name
 * - Query parameter handling
 * - Empty results and error handling
 * - Special character handling in searches
 * - Database error propagation
 *
 * @group integration
 * @group api
 */

import type { LoaderFunctionArgs } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as perfumeServer from "~/models/perfume.server"
import { loader } from "~/routes/api/perfumeLoader"

vi.mock("~/models/perfume.server")

describe("Perfume Loader API Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Loader", () => {
    it("should return perfumes matching the search name", async () => {
      const mockPerfumes = [
        {
          id: "1",
          name: "Rose Perfume",
          slug: "rose-perfume",
          description: "A rose perfume",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          name: "Rosa Absolute",
          slug: "rosa-absolute",
          description: "Another rose perfume",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(perfumeServer.searchPerfumeByName).mockResolvedValue(mockPerfumes as any)

      const request = new Request("https://example.com/api/perfumeLoader?name=rose")
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const result = await loader(args)
      const data = result instanceof Response ? await result.json() : result

      // When JSON is serialized/deserialized, Date objects become strings
      expect(data).toHaveLength(2)
      expect(data[0]).toMatchObject({
        id: mockPerfumes[0].id,
        name: mockPerfumes[0].name,
        slug: mockPerfumes[0].slug,
        description: mockPerfumes[0].description,
      })
      expect(data[1]).toMatchObject({
        id: mockPerfumes[1].id,
        name: mockPerfumes[1].name,
        slug: mockPerfumes[1].slug,
        description: mockPerfumes[1].description,
      })
      expect(perfumeServer.searchPerfumeByName).toHaveBeenCalledWith("rose")
    })

    it("should return empty array when name parameter is missing", async () => {
      const request = new Request("https://example.com/api/perfumeLoader")
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const result = await loader(args)
      const data = result instanceof Response ? await result.json() : result

      expect(data).toEqual([])
      expect(perfumeServer.searchPerfumeByName).not.toHaveBeenCalled()
    })

    it("should return empty array when no perfumes match", async () => {
      vi.mocked(perfumeServer.searchPerfumeByName).mockResolvedValue(null)

      const request = new Request("https://example.com/api/perfumeLoader?name=nonexistent")
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const result = await loader(args)
      const data = result instanceof Response ? await result.json() : result

      expect(data).toEqual([])
    })

    it("should handle empty search results", async () => {
      vi.mocked(perfumeServer.searchPerfumeByName).mockResolvedValue([])

      const request = new Request("https://example.com/api/perfumeLoader?name=xyz")
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const result = await loader(args)
      const data = result instanceof Response ? await result.json() : result

      expect(data).toEqual([])
    })

    it("should handle special characters in search query", async () => {
      const mockPerfumes = [
        {
          id: "1",
          name: "L'eau D'issey",
          slug: "leau-dissey",
          description: "A perfume",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(perfumeServer.searchPerfumeByName).mockResolvedValue(mockPerfumes as any)

      const request = new Request("https://example.com/api/perfumeLoader?name=L%27eau")
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const result = await loader(args)
      const data = result instanceof Response ? await result.json() : result

      // When JSON is serialized/deserialized, Date objects become strings
      expect(data).toHaveLength(1)
      expect(data[0]).toMatchObject({
        id: mockPerfumes[0].id,
        name: mockPerfumes[0].name,
        slug: mockPerfumes[0].slug,
        description: mockPerfumes[0].description,
      })
      expect(data[0].createdAt).toBeDefined()
      expect(data[0].updatedAt).toBeDefined()
      expect(perfumeServer.searchPerfumeByName).toHaveBeenCalledWith("L'eau")
    })

    it("should handle database errors", async () => {
      vi.mocked(perfumeServer.searchPerfumeByName).mockRejectedValue(new Error("Database connection error"))

      const request = new Request("https://example.com/api/perfumeLoader?name=test")
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      await expect(loader(args)).rejects.toThrow("Database connection error")
    })

    it("should handle URL parsing errors", async () => {
      // Test with an invalid URL scenario
      const request = new Request("https://example.com/api/perfumeLoader?name=")
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const result = await loader(args)
      const data = result instanceof Response ? await result.json() : result

      expect(data).toEqual([])
    })
  })

  describe("Query Parameter Handling", () => {
    it("should trim whitespace from search query", async () => {
      const mockPerfumes = [
        {
          id: "1",
          name: "Test Perfume",
          slug: "test-perfume",
          description: "A test perfume",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(perfumeServer.searchPerfumeByName).mockResolvedValue(mockPerfumes as any)

      const request = new Request("https://example.com/api/perfumeLoader?name=%20test%20")
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      await loader(args)

      expect(perfumeServer.searchPerfumeByName).toHaveBeenCalledWith(" test ")
    })

    it("should handle case-sensitive searches", async () => {
      const mockPerfumes = [
        {
          id: "1",
          name: "TEST PERFUME",
          slug: "test-perfume",
          description: "A test perfume",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(perfumeServer.searchPerfumeByName).mockResolvedValue(mockPerfumes as any)

      const request = new Request("https://example.com/api/perfumeLoader?name=TEST")
      const args: LoaderFunctionArgs = {
        request,
        params: {},
        context: {},
      }

      const result = await loader(args)
      const data = result instanceof Response ? await result.json() : result

      // When JSON is serialized/deserialized, Date objects become strings
      expect(data).toHaveLength(1)
      expect(data[0]).toMatchObject({
        id: mockPerfumes[0].id,
        name: mockPerfumes[0].name,
        slug: mockPerfumes[0].slug,
        description: mockPerfumes[0].description,
      })
      expect(data[0].createdAt).toBeDefined()
      expect(data[0].updatedAt).toBeDefined()
      expect(perfumeServer.searchPerfumeByName).toHaveBeenCalledWith("TEST")
    })
  })
})
