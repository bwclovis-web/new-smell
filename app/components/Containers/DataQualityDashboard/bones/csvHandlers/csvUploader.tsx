import type { ChangeEvent } from "react"

// Helper function to get CSRF token from cookies (fallback method)
const getCSRFTokenFromCookies = (): string | null => {
  const cookies = document.cookie.split(';')
  const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('_csrf='))
  return csrfCookie ? csrfCookie.split('=')[1] : null
}

// Create a function that can be called with CSRF token from the component
export const createHandleUploadCSV = (csrfToken: string | null) => async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) {
        alert('Please select a CSV file to upload.')
        return
      }

      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('Please select a valid CSV file.')
        return
      }

      console.log('Uploading CSV file:', file.name, 'Size:', file.size)
      const text = await file.text()
      console.log('CSV content preview:', text.substring(0, 200) + '...')

      // Use provided CSRF token or try to get from cookies as fallback
      const token = csrfToken || getCSRFTokenFromCookies()
      console.log('CSRF token found:', token ? 'Yes' : 'No')

      if (!token) {
        alert('CSRF token not found. Please refresh the page and try again.')
        return
      }

      // Prepare headers with CSRF token
      const headers: HeadersInit = {
        'Content-Type': 'text/csv',
        'x-csrf-token': token
      }

      console.log('Sending request to /api/update-house-info with CSRF token')
      const res = await fetch('/api/update-house-info', {
        method: 'POST',
        headers,
        body: text
      })

      console.log('Response status:', res.status)
      const result = await res.json()
      console.log('Response data:', result)

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${result.error || 'Unknown error'}`)
      }

      if (result.error) {
        alert('Error updating houses: ' + result.error)
      } else {
        const successCount = result.results?.filter((r: any) => r.status === 'created' || r.status === 'updated').length || 0
        const errorCount = result.results?.filter((r: any) => r.status === 'error').length || 0

        if (errorCount > 0) {
          alert(`CSV uploaded with issues: ${successCount} successful, ${errorCount} errors. Check console for details.`)
        } else {
          alert(`CSV uploaded successfully! Updated: ${successCount} houses`)
        }

        // Only reload if there were successful updates
        if (successCount > 0) {
          window.location.reload()
        }
      }
    } catch (error) {
      console.error('CSV upload error:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert('Failed to upload CSV: ' + errorMessage)
    }
  }

// Legacy export for backward compatibility (will try to get token from cookies)
export const handleUploadCSV = createHandleUploadCSV(null)
