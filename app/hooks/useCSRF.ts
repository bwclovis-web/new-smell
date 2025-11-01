import { useEffect, useState } from "react"

/**
 * Hook to manage CSRF tokens in React components
 * Automatically fetches and manages CSRF tokens for form submissions
 */
export function useCSRF() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get CSRF token from cookie (set by server)
    const getCSRFToken = () => {
      const cookies = document.cookie.split(";")

      const csrfCookie = cookies.find((cookie) => cookie.trim().startsWith("_csrf="))

      if (csrfCookie) {
        const token = csrfCookie.split("=")[1]
        setCsrfToken(token)
      }
      setIsLoading(false)
    }

    getCSRFToken()
  }, [])

  /**
   * Get CSRF token for form submission
   */
  const getToken = (): string | null => csrfToken

  /**
   * Add CSRF token to form data
   */
  const addToFormData = (formData: FormData): FormData => {
    if (csrfToken) {
      formData.append("_csrf", csrfToken)
    }
    return formData
  }

  /**
   * Add CSRF token to fetch headers
   */
  const addToHeaders = (headers: HeadersInit = {}): HeadersInit => {
    if (csrfToken) {
      return {
        ...headers,
        "x-csrf-token": csrfToken,
      }
    }
    return headers
  }

  /**
   * Submit form with CSRF protection
   */
  const submitForm = async (
    url: string,
    formData: FormData,
    options: RequestInit = {}
  ): Promise<Response> => {
    const protectedFormData = addToFormData(formData)
    const protectedHeaders = addToHeaders(options.headers)

    return fetch(url, {
      ...options,
      method: "POST",
      body: protectedFormData,
      headers: protectedHeaders,
    })
  }

  return {
    csrfToken,
    isLoading,
    getToken,
    addToFormData,
    addToHeaders,
    submitForm,
  }
}
