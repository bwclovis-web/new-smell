import { useEffect, useState } from 'react'

import { type DataQualityStats } from '../utils/chartDataUtils'

// Check if we should skip the fetch due to debouncing
const shouldSkipFetch = (lastFetch: number): boolean => {
  const now = Date.now()
  return now - lastFetch < 5000 // Don't fetch within 5 seconds
}

// Perform the actual API fetch
const performApiFetch = async (
  timeframe: string,
  setStats: React.Dispatch<React.SetStateAction<DataQualityStats | null>>,
  force: boolean = false
) => {
  // Add cache-busting timestamp to ensure fresh data
  const cacheBuster = Date.now()
  const forceParam = force ? '&force=true' : ''
  const url = `/api/data-quality?timeframe=${timeframe}${forceParam}&_=${cacheBuster}`

  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[DATA QUALITY] Error response:', errorText)
    throw new Error(`HTTP error! Status: ${response.status}`)
  }

  const data = await response.json()
  setStats(data)
}

// Fetch data function with debouncing and caching
export const useFetchDataQualityStats = (timeframe: 'week' | 'month' | 'all') => {
  const [stats, setStats] = useState<DataQualityStats | null>(null)
  const [loading, setLoading] = useState(true) // Start with loading true
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)
  const [refreshTrigger, setRefreshTrigger] = useState<{ count: number; force: boolean }>({ count: 0, force: false })

  useEffect(() => {
    const fetchStats = async () => {
      // Debouncing: Don't fetch if we just fetched within the last 5 seconds
      // BUT always fetch on first load (lastFetch === 0) or when manually triggered
      const isManualRefresh = refreshTrigger.count > 0
      if (lastFetch !== 0 && shouldSkipFetch(lastFetch) && !isManualRefresh) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        // Use force flag when it's a manual refresh
        await performApiFetch(timeframe, setStats, refreshTrigger.force)
        setLastFetch(Date.now())
      } catch (err) {
        setError(`Failed to fetch data quality stats: ${err instanceof Error ? err.message : String(err)}`)
        console.error('[DATA QUALITY] Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [timeframe, refreshTrigger]) // Only depend on timeframe and manual refresh trigger

  // Expose a function to force refresh
  const forceRefresh = (force: boolean = false) => setRefreshTrigger(prev => ({ count: prev.count + 1, force }))

  return { stats, loading, error, forceRefresh }
}

