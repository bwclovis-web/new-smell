import { useEffect, useMemo, useState } from "react"

interface HouseFilters {
  houseType?: string
  sortBy?: string
}

interface CachedData {
  data: any[]
  timestamp: number
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const STORAGE_PREFIX = "houses-cache-"

// Helper functions for localStorage
const getFromStorage = (key: string): CachedData | null => {
  if (typeof window === "undefined") {
    return null
  }
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch {
    return null
  }
}

const setToStorage = (key: string, data: CachedData): void => {
  if (typeof window === "undefined") {
    return
  }
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // Ignore storage errors
  }
}

const isExpired = (timestamp: number): boolean =>
  Date.now() - timestamp > CACHE_DURATION

export const useHousesWithLocalCache = (filters: HouseFilters = {}) => {
  const { houseType = "all", sortBy = "created-desc" } = filters
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const cacheKey = useMemo(
    () => `${STORAGE_PREFIX}${houseType}-${sortBy}`,
    [houseType, sortBy]
  )

  useEffect(() => {
    const handleCachedData = (cached: CachedData) => {
      if (!isExpired(cached.timestamp)) {
        setData(cached.data)
        return true
      }
      return false
    }

    const performFetch = async () => {
      const params = new URLSearchParams({ houseType, sortBy })
      const response = await fetch(`/api/houseSortLoader?${params}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    }

    const fetchFreshData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await performFetch()
        setToStorage(cacheKey, { data: result, timestamp: Date.now() })
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"))
      } finally {
        setIsLoading(false)
      }
    }

    const fetchData = async () => {
      const cached = getFromStorage(cacheKey)
      if (!cached || !handleCachedData(cached)) {
        await fetchFreshData()
      }
    }

    fetchData()
  }, [cacheKey, houseType, sortBy])

  return { data, isLoading, error }
}

// Clear all cached house data
export const clearLocalHouseCache = () => {
  if (typeof window === "undefined") {
    return
  }

  Object.keys(localStorage)
    .filter((key) => key.startsWith(STORAGE_PREFIX))
    .forEach((key) => localStorage.removeItem(key))
}
