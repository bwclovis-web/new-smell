import { useCallback, useEffect, useState } from 'react'

interface UseDebouncedSearchOptions {
  delay?: number
  minLength?: number
}

interface UseDebouncedSearchReturn<T> {
  searchValue: string
  setSearchValue: (value: string) => void
  results: T[]
  isLoading: boolean
  error: string | null
  clearResults: () => void
}

export function useDebouncedSearch<T>(
  searchFunction: (query: string) => Promise<T[]>,
  options: UseDebouncedSearchOptions = {}
): UseDebouncedSearchReturn<T> {
  const { delay = 300, minLength = 2 } = options
  const [searchValue, setSearchValue] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedSearch = useCallback(
    async (query: string) => {
      if (query.length < minLength) {
        setResults([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const searchResults = await searchFunction(query)
        setResults(searchResults)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
        setResults([])
      } finally {
        setIsLoading(false)
      }
    },
    [searchFunction, minLength]
  )

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSearch(searchValue)
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [searchValue, debouncedSearch, delay])

  const clearResults = useCallback(() => {
    setResults([])
    setSearchValue('')
    setError(null)
  }, [])

  return {
    searchValue,
    setSearchValue,
    results,
    isLoading,
    error,
    clearResults
  }
}
