export const ROUTE_PATH = "/the-vault"
import { useEffect, useState } from "react"
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
import { useLetterPagination } from "~/hooks/useLetterPagination"
import { useScrollToDataList } from "~/hooks/useScrollToDataList"
import { useSyncPaginationUrl } from "~/hooks/useSyncPaginationUrl"
import { getDefaultSortOptions } from "~/utils/sortUtils"

// No server imports needed for client component
import banner from "../images/vault.webp"

export const loader = async () =>
  // Don't load all perfumes upfront - we'll load by letter on demand
  ({})

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
  
  const [selectedSort, setSelectedSort] = useState("created-desc")

  // Get letter from URL params
  const letterFromUrl = params.letter || null
  
  // Get page from search params, default to 1
  const pageFromUrl = parseInt(searchParams.get("pg") || "1", 10)

  const sortOptions = getDefaultSortOptions(t)

  // Pagination hook
  const {
    data: perfumes,
    loading,
    error,
    pagination,
    nextPage: paginationNextPage,
    prevPage: paginationPrevPage,
  } = useLetterPagination({
    letter: letterFromUrl,
    endpoint: "/api/perfumes-by-letter",
    itemName: "perfumes",
    pageSize: 16,
    initialPage: pageFromUrl,
  })

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
    basePath: "/the-vault",
  })

  const handleLetterClick = (letter: string | null) => {
    if (letter) {
      navigate(`/the-vault/${letter.toLowerCase()}`, {
        preventScrollReset: true,
      })
    } else {
      navigate("/the-vault", { preventScrollReset: true })
    }
  }

  // Scroll when letter changes (wait for data to load)
  useScrollToDataList({
    trigger: letterFromUrl,
    enabled: !!letterFromUrl,
    isLoading: loading,
    hasData: perfumes.length > 0,
  })

  // Scroll when pagination changes (wait for data to load)
  useScrollToDataList({
    trigger: pagination.currentPage,
    enabled: !!letterFromUrl && !!pagination.currentPage,
    isLoading: loading,
    hasData: perfumes.length > 0,
  })

  const handleNextPage = async () => {
    await paginationNextPage()
  }

  const handlePrevPage = async () => {
    await paginationPrevPage()
  }

  if (error) {
    return <div>Error loading perfumes: {error}</div>
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
        selectedSort={selectedSort as any}
        onSortChange={evt => setSelectedSort(evt.target.value)}
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
        data={perfumes}
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
