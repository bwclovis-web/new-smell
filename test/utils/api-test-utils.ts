import { vi } from "vitest"

// API Testing Utilities

// Mock fetch responses
export const mockFetchResponse = (data: any, status = 200, headers = {}) =>
  vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: new Headers(headers),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
  })

// Mock fetch error
export const mockFetchError = (message = "Network error", status = 500) =>
  vi.fn().mockRejectedValue(Object.assign(new Error(message), { status }))

// Mock API endpoints
export const mockAPIEndpoints = {
  users: {
    get: mockFetchResponse({
      id: 1,
      name: "Test User",
      email: "test@example.com",
    }),
    post: mockFetchResponse({ id: 1, message: "User created" }, 201),
    put: mockFetchResponse({ id: 1, message: "User updated" }),
    delete: mockFetchResponse({ message: "User deleted" }, 204),
  },
  perfumes: {
    get: mockFetchResponse({
      id: 1,
      name: "Test Perfume",
      brand: "Test Brand",
    }),
    post: mockFetchResponse({ id: 1, message: "Perfume created" }, 201),
    put: mockFetchResponse({ id: 1, message: "Perfume updated" }),
    delete: mockFetchResponse({ message: "Perfume deleted" }, 204),
  },
  houses: {
    get: mockFetchResponse({
      id: 1,
      name: "Test House",
      description: "Test description",
    }),
    post: mockFetchResponse({ id: 1, message: "House created" }, 201),
    put: mockFetchResponse({ id: 1, message: "House updated" }),
    delete: mockFetchResponse({ message: "House deleted" }, 204),
  },
}

// Test API call with different scenarios
export const testAPICall = async (
  apiFunction: () => Promise<any>,
  scenarios: Array<{
    name: string
    mockResponse: any
    expectedResult?: any
    shouldThrow?: boolean
  }>
) => {
  for (const scenario of scenarios) {
    global.fetch = scenario.mockResponse

    if (scenario.shouldThrow) {
      await expect(apiFunction()).rejects.toThrow()
    } else {
      const result = await apiFunction()
      if (scenario.expectedResult) {
        expect(result).toEqual(scenario.expectedResult)
      }
    }

    console.log(`✓ API test "${scenario.name}" passed`)
  }
}

// Test API with different HTTP methods
export const testHTTPMethods = async (
  baseUrl: string,
  endpoints: Array<{
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
    path: string
    data?: any
    expectedStatus: number
  }>
) => {
  for (const endpoint of endpoints) {
    const mockResponse = mockFetchResponse(
      { message: "success" },
      endpoint.expectedStatus
    )
    global.fetch = mockResponse

    const response = await fetch(`${baseUrl}${endpoint.path}`, {
      method: endpoint.method,
      body: endpoint.data ? JSON.stringify(endpoint.data) : undefined,
      headers: endpoint.data ? { "Content-Type": "application/json" } : undefined,
    })

    expect(response.status).toBe(endpoint.expectedStatus)
    console.log(
      `✓ ${endpoint.method} ${endpoint.path} returned ${endpoint.expectedStatus}`
    )
  }
}

// Test API authentication
export const testAPIAuthentication = async (
  apiFunction: (token?: string) => Promise<any>,
  scenarios: Array<{
    name: string
    token?: string
    expectedStatus: number
    shouldSucceed: boolean
  }>
) => {
  for (const scenario of scenarios) {
    const mockResponse = scenario.shouldSucceed
      ? mockFetchResponse({ data: "success" }, scenario.expectedStatus)
      : mockFetchError("Unauthorized", scenario.expectedStatus)

    global.fetch = mockResponse

    if (scenario.shouldSucceed) {
      const result = await apiFunction(scenario.token)
      expect(result).toBeDefined()
    } else {
      await expect(apiFunction(scenario.token)).rejects.toThrow()
    }

    console.log(`✓ Auth test "${scenario.name}" passed`)
  }
}

// Test API rate limiting
export const testAPIRateLimit = async (
  apiFunction: () => Promise<any>,
  maxRequests: number,
  timeWindow: number
) => {
  const requests = []

  // Make multiple requests
  for (let i = 0; i < maxRequests + 1; i++) {
    requests.push(apiFunction())
  }

  // First requests should succeed
  for (let i = 0; i < maxRequests; i++) {
    await expect(requests[i]).resolves.toBeDefined()
  }

  // Last request should be rate limited
  await expect(requests[maxRequests]).rejects.toThrow(/rate limit/i)
}

// Test API caching
export const testAPICaching = async (
  apiFunction: () => Promise<any>,
  cacheKey: string
) => {
  const mockResponse = mockFetchResponse({ data: "cached" })
  global.fetch = mockResponse

  // First call should hit the API
  await apiFunction()
  expect(fetch).toHaveBeenCalledTimes(1)

  // Second call should use cache
  await apiFunction()
  expect(fetch).toHaveBeenCalledTimes(1) // Should still be 1 if cached
}

// Test API pagination
export const testAPIPagination = async (
  apiFunction: (page: number, limit: number) => Promise<any>,
  totalItems: number,
  pageSize: number
) => {
  const totalPages = Math.ceil(totalItems / pageSize)

  for (let page = 1; page <= totalPages; page++) {
    const expectedItems =
      page === totalPages ? totalItems - (page - 1) * pageSize : pageSize

    const mockResponse = mockFetchResponse({
      data: Array(expectedItems).fill({ id: 1 }),
      pagination: {
        page,
        limit: pageSize,
        total: totalItems,
        totalPages,
      },
    })

    global.fetch = mockResponse

    const result = await apiFunction(page, pageSize)
    expect(result.data).toHaveLength(expectedItems)
    expect(result.pagination.page).toBe(page)
  }
}

// Test API error handling
export const testAPIErrorHandling = async (
  apiFunction: () => Promise<any>,
  errorScenarios: Array<{
    name: string
    status: number
    message: string
    expectedBehavior: "throw" | "return_error"
  }>
) => {
  for (const scenario of errorScenarios) {
    const mockError = mockFetchError(scenario.message, scenario.status)
    global.fetch = mockError

    if (scenario.expectedBehavior === "throw") {
      await expect(apiFunction()).rejects.toThrow(scenario.message)
    } else {
      const result = await apiFunction()
      expect(result.error).toBe(scenario.message)
    }

    console.log(`✓ Error handling "${scenario.name}" passed`)
  }
}

// Test API with loading states
export const testAPILoadingStates = async (
  apiFunction: () => Promise<any>,
  getLoadingState: () => boolean
) => {
  const slowMockResponse = vi.fn().mockImplementation(
    () =>
      new Promise((resolve) => {
        setTimeout(
          () =>
            resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({ data: "success" }),
            }),
          100
        )
      })
  )

  global.fetch = slowMockResponse

  const apiPromise = apiFunction()

  // Should be loading initially
  expect(getLoadingState()).toBe(true)

  await apiPromise

  // Should not be loading after completion
  expect(getLoadingState()).toBe(false)
}

// Create mock server responses
export const createMockServer = (responses: Record<string, any>) =>
  vi.fn().mockImplementation((url: string, options: any = {}) => {
    const method = options.method || "GET"
    const key = `${method} ${url}`

    if (responses[key]) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(responses[key]),
      })
    }

    return Promise.reject(new Error(`No mock response for ${key}`))
  })

// Test API with different content types
export const testAPIContentTypes = async (
  baseUrl: string,
  contentTypes: Array<{
    type: string
    data: any
    endpoint: string
  }>
) => {
  for (const test of contentTypes) {
    const mockResponse = mockFetchResponse({ success: true })
    global.fetch = mockResponse

    await fetch(`${baseUrl}${test.endpoint}`, {
      method: "POST",
      headers: { "Content-Type": test.type },
      body: test.type === "application/json" ? JSON.stringify(test.data) : test.data,
    })

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(test.endpoint),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": test.type,
        }),
      })
    )
  }
}
