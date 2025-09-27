/* eslint-disable max-statements, max-len, curly, array-bracket-newline */
//
import { type RefObject, useEffect, useRef, useState } from 'react'

import type { SafeUserPerfume } from '~/types'

interface UseInfiniteScrollOptions {
  houseSlug: string
  initialPerfumes: SafeUserPerfume[]
  scrollContainerRef: RefObject<HTMLDivElement | null>
  take?: number
  threshold?: number
  debounceTime?: number
}

interface UseInfiniteScrollReturn {
  perfumes: SafeUserPerfume[]
  loading: boolean
  hasMore: boolean
  observerRef: RefObject<HTMLDivElement | null>
  loadMorePerfumes: () => Promise<void>
}

async function fetchPerfumes(houseSlug: string, skip: number, take: number) {
  const url = `/api/more-perfumes?houseSlug=${encodeURIComponent(houseSlug)}&skip=${skip}&take=${take}`
  const response = await fetch(url)
  return response.json()
}

export function useInfiniteScroll(options: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  const {
    houseSlug,
    initialPerfumes,
    scrollContainerRef,
    take = 9,
    threshold = 200,
    debounceTime = 500
  } = options

  const [perfumes, setPerfumes] = useState(initialPerfumes)
  const [skip, setSkip] = useState(initialPerfumes.length)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialPerfumes.length === take)
  const observerRef = useRef<HTMLDivElement | null>(null)
  const isInitialMount = useRef(true)
  const lastTriggerTime = useRef(0)

  const loadMorePerfumes = async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const data = await fetchPerfumes(houseSlug, skip, take)
      if (data.success && Array.isArray(data.perfumes)) {
        setPerfumes(prev => [...prev, ...data.perfumes])
        setSkip(prev => prev + data.perfumes.length)
        setHasMore(data.perfumes.length === take)
      } else {
        setHasMore(false)
      }
    } catch {
      setHasMore(false)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    if (!scrollContainerRef.current) return

    const scrollContainer = scrollContainerRef.current
    const handleScroll = () => {
      if (loading || !hasMore) return

      const now = Date.now()
      if (now - lastTriggerTime.current < debounceTime) return

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer
      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        lastTriggerTime.current = now
        loadMorePerfumes()
      }
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [loading, hasMore, skip, scrollContainerRef.current, debounceTime, threshold])

  return { perfumes, loading, hasMore, observerRef, loadMorePerfumes }
}
