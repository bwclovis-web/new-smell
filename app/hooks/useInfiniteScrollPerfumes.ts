import { type RefObject, useEffect, useRef, useState } from "react"

interface UseInfiniteScrollPerfumesOptions {
  letter: string
  initialPerfumes: any[]
  scrollContainerRef: RefObject<HTMLDivElement | null>
  take?: number
  threshold?: number
  debounceTime?: number
}

interface UseInfiniteScrollPerfumesReturn {
  perfumes: any[]
  loading: boolean
  hasMore: boolean
  totalCount: number
  observerRef: RefObject<HTMLDivElement | null>
  loadMorePerfumes: () => Promise<void>
  resetPerfumes: (newPerfumes: any[], newTotalCount: number) => void
}

async function fetchPerfumesByLetter(letter: string, skip: number, take: number) {
  const url = `/api/perfumes-by-letter?letter=${letter}&skip=${skip}&take=${take}`
  const response = await fetch(url)
  return response.json()
}

export function useInfiniteScrollPerfumes(
  options: UseInfiniteScrollPerfumesOptions
): UseInfiniteScrollPerfumesReturn {
  const {
    letter,
    initialPerfumes,
    scrollContainerRef,
    take = 12,
    threshold = 200,
    debounceTime = 500,
  } = options

  const [perfumes, setPerfumes] = useState(initialPerfumes)
  const [skip, setSkip] = useState(initialPerfumes.length)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialPerfumes.length === take)
  const [totalCount, setTotalCount] = useState(0)
  const observerRef = useRef<HTMLDivElement | null>(null)
  const isInitialMount = useRef(true)
  const lastTriggerTime = useRef(0)

  const loadMorePerfumes = async () => {
    if (loading || !hasMore) {
      return
    }

    setLoading(true)
    try {
      const data = await fetchPerfumesByLetter(letter, skip, take)
      if (data.success && Array.isArray(data.perfumes)) {
        setPerfumes((prev) => [...prev, ...data.perfumes])
        setSkip((prev) => prev + data.perfumes.length)
        setHasMore(data.meta.hasMore)
        setTotalCount(data.meta.totalCount)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      setHasMore(false)
    }
    setLoading(false)
  }

  const resetPerfumes = (newPerfumes: any[], newTotalCount: number) => {
    setPerfumes(newPerfumes)
    setSkip(newPerfumes.length)
    setTotalCount(newTotalCount)
    setHasMore(newPerfumes.length < newTotalCount)
  }

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
        loadMorePerfumes()
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
  ])

  return {
    perfumes,
    loading,
    hasMore,
    totalCount,
    observerRef,
    loadMorePerfumes,
    resetPerfumes,
  }
}
