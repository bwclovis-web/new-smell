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

  // Pagination hook
  const {
    data: houses,
    loading,
    error,
    pagination,
    nextPage: paginationNextPage,
    prevPage: paginationPrevPage,
  } = useLetterPagination({
    letter: letterFromUrl,
    endpoint: "/api/houses-by-letter-paginated",
    itemName: "houses",
    pageSize: 16,
    houseType: selectedHouseType,
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

  // Scroll when letter changes (wait for data to load)
  useScrollToDataList({
    trigger: letterFromUrl,
    enabled: !!letterFromUrl,
    isLoading: loading,
    hasData: houses.length > 0,
  })

  // Scroll when pagination changes (wait for data to load)
  useScrollToDataList({
    trigger: pagination.currentPage,
    enabled: !!letterFromUrl && !!pagination.currentPage,
    isLoading: loading,
    hasData: houses.length > 0,
  })

  const handleNextPage = async () => {
    await paginationNextPage()
  }

  const handlePrevPage = async () => {
    await paginationPrevPage()
  }

  if (error) {
    return <div>Error loading houses: {error}</div>
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
