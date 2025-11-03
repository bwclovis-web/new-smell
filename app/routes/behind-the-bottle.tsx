import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  type MetaFunction,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router"

import AlphabeticalNav from "~/components/Organisms/AlphabeticalNav"
import DataDisplaySection from "~/components/Organisms/DataDisplaySection"
import DataFilters from "~/components/Organisms/DataFilters"
import TitleBanner from "~/components/Organisms/TitleBanner"
import { useInfiniteHouses } from "~/hooks/useInfiniteHouses"
import { useScrollToDataList } from "~/hooks/useScrollToDataList"
import { useSyncPaginationUrl } from "~/hooks/useSyncPaginationUrl"
import { getDefaultSortOptions } from "~/utils/sortUtils"

// No server imports needed for client component
import banner from "../images/behind.webp"

export const ROUTE_PATH = "/behind-the-bottle"

export const loader = async () => ({
  // Don't load all houses upfront - we'll load by letter on demand
})

export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t("allHouses.meta.title") },
    { name: "description", content: t("allHouses.meta.description") },
  ]
}

const useHouseFilters = (t: ReturnType<typeof useTranslation>["t"]) => {
  const houseTypeOptions = [
    {
      id: "all",
      value: "all",
      label: t("allHouses.houseTypes.all"),
      name: "houseType",
      defaultChecked: true,
    },
    {
      id: "niche",
      value: "niche",
      label: t("allHouses.houseTypes.niche"),
      name: "houseType",
      defaultChecked: false,
    },
    {
      id: "designer",
      value: "designer",
      label: t("allHouses.houseTypes.designer"),
      name: "houseType",
      defaultChecked: false,
    },
    {
      id: "indie",
      value: "indie",
      label: t("allHouses.houseTypes.indie"),
      name: "houseType",
      defaultChecked: false,
    },
    {
      id: "celebrity",
      value: "celebrity",
      label: t("allHouses.houseTypes.celebrity"),
      name: "houseType",
      defaultChecked: false,
    },
    {
      id: "drugstore",
      value: "drugstore",
      label: t("allHouses.houseTypes.drugstore"),
      name: "houseType",
      defaultChecked: false,
    },
  ]

  const sortOptions = getDefaultSortOptions(t)

  return { houseTypeOptions, sortOptions }
}

const useHouseHandlers = (setSelectedHouseType: any, setSelectedSort: any) => {
  const handleHouseTypeChange = (evt: { target: { value: string } }) => {
    setSelectedHouseType(evt.target.value)
  }

  const handleSortChange = (evt: { target: { value: string } }) => {
    setSelectedSort(evt.target.value as any)
  }

  return { handleHouseTypeChange, handleSortChange }
}

const useHousesPagination = (
  data: any,
  currentPage: number,
  pageSize: number
) => {
  const allHouses = useMemo(() => {
    if (!data?.pages) {
      return []
    }
    return data.pages.flatMap((page: any) => page.houses || [])
  }, [data])

  const totalCount = data?.pages[0]?.count || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  const houses = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize
    const endIdx = startIdx + pageSize
    return allHouses.slice(startIdx, endIdx)
  }, [allHouses, currentPage, pageSize])

  const pagination = useMemo(
    () => ({
      currentPage,
      totalPages,
      totalCount,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      pageSize,
    }),
    [
      currentPage,
      totalPages,
      totalCount,
      pageSize,
    ]
  )

  return { houses, pagination }
}

const usePageNavigation = (
  navigate: any,
  letterFromUrl: string | null,
  currentPage: number,
  pagination: { totalPages: number }
) => {
  const handleNextPage = async () => {
    if (currentPage < pagination.totalPages) {
      navigate(
        `/behind-the-bottle/${letterFromUrl?.toLowerCase()}?pg=${currentPage + 1}`,
        { preventScrollReset: true }
      )
    }
  }

  const handlePrevPage = async () => {
    if (currentPage > 1) {
      if (currentPage === 2) {
        navigate(`/behind-the-bottle/${letterFromUrl?.toLowerCase()}`, {
          preventScrollReset: true,
        })
      } else {
        navigate(
          `/behind-the-bottle/${letterFromUrl?.toLowerCase()}?pg=${currentPage - 1}`,
          { preventScrollReset: true }
        )
      }
    }
  }

  return { handleNextPage, handlePrevPage }
}

const useHousesData = (
  letterFromUrl: string | null,
  selectedHouseType: string,
  currentPage: number
) => {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useInfiniteHouses({
    letter: letterFromUrl,
    houseType: selectedHouseType,
    pageSize: 16,
  })

  const pageSize = 16

  useEffect(() => {
    if (letterFromUrl && currentPage > data?.pages?.length) {
      const pagesToFetch = currentPage - (data?.pages?.length || 0)
      let fetchCount = 0
      
      const fetchPagesSequentially = async () => {
        while (fetchCount < pagesToFetch && hasNextPage) {
          await fetchNextPage()
          fetchCount++
        }
      }
      
      fetchPagesSequentially().catch(() => {
        // Silently fail
      })
    }
  }, [
    currentPage,
    data?.pages?.length,
    hasNextPage,
    letterFromUrl,
    fetchNextPage,
  ])

  const { houses, pagination } = useHousesPagination(data, currentPage, pageSize)
  const loading = isLoading || isFetchingNextPage

  return { houses, pagination, loading, error, data }
}

const AllHousesPage = () => {
  const { t } = useTranslation()
  const params = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [selectedHouseType, setSelectedHouseType] = useState("all")
  const [selectedSort, setSelectedSort] = useState<any>("created-desc")

  // Get letter from URL params
  const letterFromUrl = params.letter || null
  
  // Get page from search params, default to 1
  const pageFromUrl = parseInt(searchParams.get("pg") || "1", 10)

  const filters = useHouseFilters(t)
  const handlers = useHouseHandlers(setSelectedHouseType, setSelectedSort)

  const { houses, pagination, loading, error } = useHousesData(
    letterFromUrl,
    selectedHouseType,
    pageFromUrl
  )

  const { handleNextPage, handlePrevPage } = usePageNavigation(
    navigate,
    letterFromUrl,
    pageFromUrl,
    pagination
  )

  // Preserve scroll position during loading to prevent jump to top
  useEffect(() => {
    if (loading) {
      const savedPosition = window.scrollY || document.documentElement.scrollTop
      // Prevent automatic scroll to top during loading
      if (savedPosition > 0) {
        window.scrollTo(0, savedPosition)
      }
    }
  }, [loading])

  // Sync URL when page changes from pagination (but not on letter change)
  useSyncPaginationUrl({
    currentPage: pagination.currentPage,
    pageFromUrl,
    letter: letterFromUrl,
    basePath: "/behind-the-bottle",
  })

  const handleLetterClick = (letter: string | null) => {
    if (letter) {
      navigate(`/behind-the-bottle/${letter.toLowerCase()}`, {
        preventScrollReset: true,
      })
    } else {
      navigate("/behind-the-bottle", { preventScrollReset: true })
    }
  }

  // Scroll when letter or pagination changes (wait for data to load)
  useScrollToDataList({
    trigger: letterFromUrl,
    enabled: !!letterFromUrl,
    isLoading: loading,
    hasData: houses.length > 0,
  })
  useScrollToDataList({
    trigger: pagination.currentPage,
    enabled: !!letterFromUrl && !!pagination.currentPage,
    isLoading: loading,
    hasData: houses.length > 0,
  })

  if (error) {
    return <div>Error loading houses: {error instanceof Error ? error.message : "Unknown error"}</div>
  }

  return (
    <section>
      <TitleBanner
        image={banner}
        heading={t("allHouses.heading")}
        subheading={t("allHouses.subheading")}
      />

      <DataFilters
        searchType="perfume-house"
        sortOptions={filters.sortOptions}
        typeOptions={filters.houseTypeOptions}
        selectedSort={selectedSort}
        selectedType={selectedHouseType}
        onSortChange={handlers.handleSortChange}
        onTypeChange={handlers.handleHouseTypeChange}
        className="mb-8"
      />

      <AlphabeticalNav
        selectedLetter={letterFromUrl}
        onLetterSelect={handleLetterClick}
        prefetchType="houses"
        houseType={selectedHouseType}
        className="mb-8"
      />

      {/* Houses Display */}
      <DataDisplaySection
        data={houses}
        isLoading={loading}
        type="house"
        selectedLetter={letterFromUrl}
        sourcePage="behind-the-bottle"
        pagination={pagination}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
      />
    </section>
  )
}

export default AllHousesPage
