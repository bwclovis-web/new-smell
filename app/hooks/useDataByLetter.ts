import { useCallback, useEffect, useState } from "react"

interface UseDataByLetterProps {
  endpoint: string
  itemName: string
  houseType?: string
}

interface UseDataByLetterReturn<T> {
  initialData: T[]
  totalCount: number
  isLoading: boolean
  error: string | null
  loadDataByLetter: (
    letter: string,
    houseType?: string
  ) => Promise<{ data: T[]; totalCount: number } | null>
}

const useDataByLetter = <T>({
  endpoint,
  itemName,
  houseType = "all",
}: UseDataByLetterProps): UseDataByLetterReturn<T> => {
  const [initialData, setInitialData] = useState<T[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentLetter, setCurrentLetter] = useState<string | null>(null)

  const fetchData = useCallback(
    async (letter: string, currentHouseType: string = houseType) => {
      const url = `${endpoint}?letter=${letter}&skip=0&take=16&houseType=${currentHouseType}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch ${itemName}: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      if (!data.success) {
        throw new Error(data.message || `Failed to fetch ${itemName}`)
      }
      return data
    },
    [endpoint, itemName, houseType]
  )

  const extractItems = useCallback(
    (data: any): T[] => {
      if (itemName === "houses") {
        return data.houses || []
      } else if (itemName === "perfumes") {
        return data.perfumes || []
      } else {
        return data[itemName] || []
      }
    },
    [itemName]
  )

  const loadDataByLetter = useCallback(
    async (letter: string, currentHouseType: string = houseType) => {
      setIsLoading(true)
      setError(null)
      setCurrentLetter(letter)
      try {
        const data = await fetchData(letter, currentHouseType)
        const items = extractItems(data)
        const count = data.meta?.totalCount || items.length

        setInitialData(items)
        setTotalCount(count)

        return { data: items, totalCount: count }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : `Failed to load ${itemName}`
        setError(errorMessage)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [fetchData, extractItems, houseType]
  )

  // Reload data when houseType changes if we have a current letter
  useEffect(() => {
    if (currentLetter) {
      loadDataByLetter(currentLetter, houseType)
    }
  }, [houseType])

  return { initialData, totalCount, isLoading, error, loadDataByLetter }
}

export default useDataByLetter
