import { useState } from "react"

import { useCSRF } from "~/hooks/useCSRF"
import type { NotificationResult } from "~/utils/wishlist-notification-processor"

export default function NotificationProcessor() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<NotificationResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const { addToHeaders } = useCSRF()

  const handleApiCall = async () => {
    const headers = addToHeaders({
      "Content-Type": "application/json",
    })

    const response = await fetch("/api/process-wishlist-notifications", {
      method: "POST",
      headers,
    })

    return response.json()
  }

  const handleResults = (data: any) => {
    if (data.success) {
      setResults(data.notifications)
    } else {
      setError(data.error || "Unknown error occurred")
    }
  }

  const processNotifications = async () => {
    setIsProcessing(true)
    setError(null)
    setResults([])

    try {
      const data = await handleApiCall()
      handleResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error occurred")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Wishlist Notification Processor</h1>

      <div className="mb-6">
        <button
          onClick={processNotifications}
          disabled={isProcessing}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
        >
          {isProcessing ? "Processing..." : "Process Notifications"}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded text-red-700">
          Error: {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Processed {results.length} notifications
          </h2>

          <div className="space-y-4">
            {results.map(result => (
              <div
                key={`${result.userId}-${result.perfumeId}`}
                className="border border-gray-200 rounded p-4 bg-gray-50"
              >
                <h3 className="font-medium text-lg">{result.perfumeName}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Notification sent to user: {result.userId}
                </p>
                <div>
                  <p className="text-sm font-medium">Available from:</p>
                  <ul className="text-sm text-gray-600 ml-4">
                    {result.sellers.map(seller => (
                      <li key={seller.userId}>
                        {seller.email} ({seller.userId})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isProcessing && results.length === 0 && !error && (
        <div className="text-gray-500">
          Click the button above to process pending wishlist notifications.
        </div>
      )}
    </div>
  )
}
