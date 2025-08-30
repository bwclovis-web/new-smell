import { type RefObject, useEffect, useRef, useState } from 'react'

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
  console.log('Fetching more perfumes:', { letter, skip, take, url })
  const response = await fetch(url)
  return response.json()
}

export function useInfiniteScrollPerfumes(options: UseInfiniteScrollPerfumesOptions): UseInfiniteScrollPerfumesReturn {
  const {
    letter,
    initialPerfumes,
    scrollContainerRef,
    take = 12,
    threshold = 200,
    debounceTime = 500
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
      console.log('loadMorePerfumes blocked:', { loading, hasMore })
      return
    }

    console.log('Loading more perfumes...')
    setLoading(true)
    try {
      const data = await fetchPerfumesByLetter(letter, skip, take)
      console.log('loadMorePerfumes response:', data)
      if (data.success && Array.isArray(data.perfumes)) {
        // Add new perfumes to the END of the existing list
        setPerfumes(prev => [...prev, ...data.perfumes])
        setSkip(prev => prev + data.perfumes.length)
        setHasMore(data.meta?.hasMore || false)
        setTotalCount(data.meta?.totalCount || data.perfumes.length)
        console.log('Updated state:', {
          newPerfumesCount: data.perfumes.length,
          hasMore: data.meta?.hasMore,
          totalCount: data.meta?.totalCount
        })
      } else {
        setHasMore(false)
        console.log('Setting hasMore to false due to failed response')
      }
    } catch (error) {
      console.error('Error loading more perfumes:', error)
      setHasMore(false)
    }
    setLoading(false)
  }

  const resetPerfumes = (newPerfumes: any[], newTotalCount: number) => {
    console.log('resetPerfumes called:', { newPerfumes: newPerfumes.length, newTotalCount })
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
        console.log('Scroll blocked:', { loading, hasMore })
        return
      }

      const now = Date.now()
      if (now - lastTriggerTime.current < debounceTime) {
        return
      }

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer
      console.log('Scroll check:', { scrollTop, scrollHeight, clientHeight, threshold })
      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        console.log('Triggering loadMorePerfumes')
        lastTriggerTime.current = now
        loadMorePerfumes()
      }
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [
    loading, hasMore, skip, scrollContainerRef.current, debounceTime, threshold, letter
  ])

  return { perfumes, loading, hasMore, totalCount, observerRef, loadMorePerfumes, resetPerfumes }
}
