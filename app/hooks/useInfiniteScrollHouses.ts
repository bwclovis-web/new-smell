import { type RefObject, useEffect, useRef, useState } from "react"

interface UseInfiniteScrollHousesOptions {
  letter: string
  initialHouses: any[]
  scrollContainerRef: RefObject<HTMLDivElement | null>
  take?: number
  threshold?: number
  debounceTime?: number
  houseType?: string
}

interface UseInfiniteScrollHousesReturn {
  houses: any[]
  loading: boolean
  hasMore: boolean
  totalCount: number
  observerRef: RefObject<HTMLDivElement | null>
  loadMoreHouses: () => Promise<void>
  resetHouses: (newHouses: any[], newTotalCount: number) => void
}

async function fetchHousesByLetter(
  letter: string,
  skip: number,
  take: number,
  houseType: string = "all"
) {
  const url = `/api/houses-by-letter-paginated?letter=${letter}&skip=${skip}&take=${take}&houseType=${houseType}`
  const response = await fetch(url)
  return response.json()
}

export function useInfiniteScrollHouses(options: UseInfiniteScrollHousesOptions): UseInfiniteScrollHousesReturn {
  const {
    letter,
    initialHouses,
    scrollContainerRef,
    take = 16,
    threshold = 200,
    debounceTime = 500,
    houseType = "all",
  } = options

  const [houses, setHouses] = useState(initialHouses)
  const [skip, setSkip] = useState(initialHouses.length)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialHouses.length === take)
  const [totalCount, setTotalCount] = useState(0)
  const observerRef = useRef<HTMLDivElement | null>(null)
  const isInitialMount = useRef(true)
  const lastTriggerTime = useRef(0)
  const previousHouseType = useRef(houseType)

  const loadMoreHouses = async () => {
    if (loading || !hasMore) {
      return
    }

    setLoading(true)
    try {
      const data = await fetchHousesByLetter(letter, skip, take, houseType)
      if (data.success && Array.isArray(data.houses)) {
        setHouses(prev => [...prev, ...data.houses])
        setSkip(prev => prev + data.houses.length)
        setHasMore(data.meta.hasMore)
        setTotalCount(data.meta.totalCount)
      } else {
        setHasMore(false)
      }
    } catch {
      setHasMore(false)
    }
    setLoading(false)
  }

  const resetHouses = (newHouses: any[], newTotalCount: number) => {
    setHouses(newHouses)
    setSkip(newHouses.length)
    setTotalCount(newTotalCount)
    setHasMore(newHouses.length < newTotalCount)
  }

  // Reset state when houseType changes
  useEffect(() => {
    if (previousHouseType.current !== houseType) {
      previousHouseType.current = houseType
      // Don't clear houses immediately - let the new data from useDataByLetter populate them
      // The resetHouses function will be called with new data from the parent
    }
  }, [houseType])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    if (!scrollContainerRef.current) {
      return
    }

    const scrollContainer = scrollContainerRef.current
    const handleScroll = () => {
      if (loading || !hasMore) {
        return
      }

      const now = Date.now()
      if (now - lastTriggerTime.current < debounceTime) {
        return
      }

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer
      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        lastTriggerTime.current = now
        loadMoreHouses()
      }
    }

    scrollContainer.addEventListener("scroll", handleScroll)
    return () => scrollContainer.removeEventListener("scroll", handleScroll)
  }, [
    loading,
    hasMore,
    skip,
    scrollContainerRef.current,
    debounceTime,
    threshold,
    letter,
    houseType,
  ])

  return {
    houses,
    loading,
    hasMore,
    totalCount,
    observerRef,
    loadMoreHouses,
    resetHouses,
  }
}
