import { useMemo, useState } from "react"
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
import { useInfinitePagination } from "~/hooks/useInfinitePagination"
import { useInfinitePerfumesByLetter } from "~/hooks/useInfinitePerfumes"
import {
  usePaginatedNavigation,
  usePreserveScrollPosition,
} from "~/hooks/usePaginatedNavigation"
import { useScrollToDataList } from "~/hooks/useScrollToDataList"
import { useSyncPaginationUrl } from "~/hooks/useSyncPaginationUrl"
import { getDefaultSortOptions, sortItems, type SortOption } from "~/utils/sortUtils"

// No server imports needed for client component
import banner from "../images/vault.webp"

export const ROUTE_PATH = "/the-vault"

const PAGE_SIZE = 16

export const loader = async () => (
  // Don't load all perfumes upfront - we'll load by letter on demand
  {}
)

export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t("allPerfumes.meta.title") },
    { name: "description", content: t("allPerfumes.meta.description") },
  ]
}

const AllPerfumesPage = () => {
  const { t } = useTranslation()
  const params = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [selectedSort, setSelectedSort] = useState<SortOption>("created-desc")

  // Get letter from URL params
  const letterFromUrl = params.letter || null
  
  // Get page from search params, default to 1
  const pageFromUrl = parseInt(searchParams.get("pg") || "1", 10)

  const sortOptions = getDefaultSortOptions(t)

  // TanStack Query infinite query
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useInfinitePerfumesByLetter({
    letter: letterFromUrl,
    houseType: "all",
    pageSize: PAGE_SIZE,
  })

  const { items: perfumes, pagination, loading } = useInfinitePagination({
    pages: data?.pages,
    currentPage: pageFromUrl,
    pageSize: PAGE_SIZE,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    extractItems: page => (page as any).perfumes || [],
    extractTotalCount: page => (
      (page as any)?.meta?.totalCount ?? (page as any)?.count
    ),
  })

  const normalizedPerfumes = useMemo(
    () => perfumes.map(perfume => ({
        ...perfume,
        createdAt: perfume.createdAt ?? perfume.updatedAt ?? new Date(0),
      })),
    [perfumes]
  )

  const sortedPerfumes = useMemo(
    () => sortItems(normalizedPerfumes as any, selectedSort),
    [normalizedPerfumes, selectedSort]
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

  // Scroll when letter changes (wait for data to load)
  useScrollToDataList({
    trigger: letterFromUrl,
    enabled: !!letterFromUrl,
    isLoading: loading,
    hasData: perfumes.length > 0,
    additionalOffset: 32,
  })

  // Scroll when pagination changes (wait for data to load)
  useScrollToDataList({
    trigger: pagination.currentPage,
    enabled: !!letterFromUrl && !!pagination.currentPage,
    isLoading: loading,
    hasData: perfumes.length > 0,
    additionalOffset: 32,
    skipInitialScroll: true,
  })

  if (error) {
    return <div>Error loading perfumes: {error instanceof Error ? error.message : "Unknown error"}</div>
  }

  return (
    <section>
      <TitleBanner
        image={banner}
        heading={t("allPerfumes.heading")}
        subheading={t("allPerfumes.subheading")}
      />

      <DataFilters
        searchType="perfume"
        sortOptions={sortOptions}
        selectedSort={selectedSort}
        onSortChange={evt => setSelectedSort(evt.target.value as SortOption)}
        className="mb-8"
      />

      <AlphabeticalNav
        selectedLetter={letterFromUrl}
        onLetterSelect={handleLetterClick}
        prefetchType="perfumes"
        houseType="all"
        className="mb-8"
      />

      {/* Perfumes Display */}
      <DataDisplaySection
        data={sortedPerfumes}
        isLoading={loading}
        type="perfume"
        selectedLetter={letterFromUrl}
        sourcePage="vault"
        pagination={pagination}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
      />
    </section>
  )
}

export default AllPerfumesPage
