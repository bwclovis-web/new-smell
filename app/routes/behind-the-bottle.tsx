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
import { useInfinitePagination } from "~/hooks/useInfinitePagination"
import { useResponsivePageSize } from "~/hooks/useMediaQuery"
import {
  usePaginatedNavigation,
  usePreserveScrollPosition,
} from "~/hooks/usePaginatedNavigation"
import { useScrollToDataList } from "~/hooks/useScrollToDataList"
import { useSyncPaginationUrl } from "~/hooks/useSyncPaginationUrl"
import { getDefaultSortOptions, sortItems, type SortOption } from "~/utils/sortUtils"

import banner from "../images/behind-bottle.webp"

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

const useHouseHandlers = (
  setSelectedHouseType: (houseType: string) => void,
  setSelectedSort: (sort: SortOption) => void
) => {
  const handleHouseTypeChange = (evt: { target: { value: string } }) => {
    setSelectedHouseType(evt.target.value)
  }

  const handleSortChange = (evt: { target: { value: string } }) => {
    setSelectedSort(evt.target.value as SortOption)
  }

  return { handleHouseTypeChange, handleSortChange }
}

const useHousesData = (
  letterFromUrl: string | null,
  selectedHouseType: string,
  currentPage: number,
  pageSize: number
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
    pageSize,
  })

  const loadedPages = data?.pages?.length ?? 0

  useEffect(() => {
    if (!letterFromUrl) {
      return
    }

    if (currentPage <= loadedPages) {
      return
    }

    const pagesToFetch = currentPage - loadedPages
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
  }, [
    currentPage,
    fetchNextPage,
    hasNextPage,
    letterFromUrl,
    loadedPages,
  ])

  const { items: houses, pagination, loading } = useInfinitePagination({
    pages: data?.pages,
    currentPage,
    pageSize,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    extractItems: page => (page as any).houses || [],
    extractTotalCount: page => (
      (page as any)?.meta?.totalCount ?? (page as any)?.count
    ),
  })

  return { houses, pagination, loading, error, data }
}

const AllHousesPage = () => {
  const { t } = useTranslation()
  const params = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [selectedHouseType, setSelectedHouseType] = useState("all")
  const [selectedSort, setSelectedSort] = useState<SortOption>("created-desc")

  // Get responsive page size based on screen size
  const pageSize = useResponsivePageSize()

  // Get letter from URL params
  const letterFromUrl = params.letter || null
  
  // Get page from search params, default to 1
  const pageFromUrl = parseInt(searchParams.get("pg") || "1", 10)

  const filters = useHouseFilters(t)
  const handlers = useHouseHandlers(setSelectedHouseType, setSelectedSort)

  const { houses, pagination, loading, error } = useHousesData(
    letterFromUrl,
    selectedHouseType,
    pageFromUrl,
    pageSize
  )

  const normalizedHouses = useMemo(
    () => houses.map(house => ({
        ...house,
        createdAt: house.createdAt ?? house.updatedAt ?? new Date(0),
      })),
    [houses]
  )

  const sortedHouses = useMemo(
    () => sortItems(normalizedHouses as any, selectedSort),
    [normalizedHouses, selectedSort]
  )

  const { handleNextPage, handlePrevPage } = usePaginatedNavigation({
    currentPage: pagination.currentPage,
    hasNextPage: pagination.hasNextPage,
    hasPrevPage: pagination.hasPrevPage,
    navigate,
    buildPath: page => {
      const letterSegment = letterFromUrl
        ? `/${letterFromUrl.toLowerCase()}`
        : ""
      const pageSuffix = page > 1 ? `?pg=${page}` : ""
      return `${ROUTE_PATH}${letterSegment}${pageSuffix}`
    },
  })

  // Preserve scroll position during loading to prevent jump to top
  usePreserveScrollPosition(loading)

  // Sync URL when page changes from pagination (but not on letter change)
  useSyncPaginationUrl({
    currentPage: pagination.currentPage,
    pageFromUrl,
    letter: letterFromUrl,
    basePath: ROUTE_PATH,
  })

  const handleLetterClick = (letter: string | null) => {
    if (letter) {
      navigate(`${ROUTE_PATH}/${letter.toLowerCase()}`, {
        preventScrollReset: true,
      })
    } else {
      navigate(ROUTE_PATH, { preventScrollReset: true })
    }
  }

  // Scroll when letter or pagination changes (wait for data to load)
  useScrollToDataList({
    trigger: letterFromUrl,
    enabled: !!letterFromUrl,
    isLoading: loading,
    hasData: houses.length > 0,
    additionalOffset: 32,
  })
  useScrollToDataList({
    trigger: pagination.currentPage,
    enabled: !!letterFromUrl && !!pagination.currentPage,
    isLoading: loading,
    hasData: houses.length > 0,
    additionalOffset: 32,
    skipInitialScroll: true,
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
        data={sortedHouses}
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
