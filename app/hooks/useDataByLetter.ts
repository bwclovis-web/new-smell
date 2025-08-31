import { useState } from 'react'

interface UseDataByLetterProps {
  endpoint: string
  itemName: string
}

interface UseDataByLetterReturn<T> {
  initialData: T[]
  totalCount: number
  isLoading: boolean
  error: string | null
  loadDataByLetter: (letter: string) => Promise<{ data: T[], totalCount: number } | null>
}

const useDataByLetter = <T>({ endpoint, itemName }: UseDataByLetterProps): UseDataByLetterReturn<T> => {
  const [initialData, setInitialData] = useState<T[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async (letter: string) => {
    const response = await fetch(`${endpoint}?letter=${letter}&skip=0&take=12`)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${itemName}: ${response.status} ${response.statusText}`)
    }
    const data = await response.json()
    if (!data.success) {
      throw new Error(data.message || `Failed to fetch ${itemName}`)
    }
    return data
  }

  const extractItems = (data: any): T[] => {
    if (itemName === 'houses') {
      return data.houses || []
    } else if (itemName === 'perfumes') {
      return data.perfumes || []
    } else {
      return data[itemName] || []
    }
  }

  const loadDataByLetter = async (letter: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchData(letter)
      const items = extractItems(data)
      const count = data.meta?.totalCount || items.length

      setInitialData(items)
      setTotalCount(count)

      return { data: items, totalCount: count }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to load ${itemName}`
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { initialData, totalCount, isLoading, error, loadDataByLetter }
}

export default useDataByLetter
