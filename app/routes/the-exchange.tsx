import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  type LoaderFunctionArgs,
  type MetaFunction,
  NavLink,
  useLoaderData,
  useNavigate,
} from "react-router"

import { Button } from "~/components/Atoms/Button"
import SearchInput from "~/components/Atoms/SearchInput/SearchInput"
import LinkCard from "~/components/Organisms/LinkCard"
import TitleBanner from "~/components/Organisms/TitleBanner"
import { getPerfumeTypeLabel } from "~/data/SelectTypes"
import { getAvailablePerfumesForDecantingPaginated } from "~/models/perfume.server"
import { getUserDisplayName } from "~/utils/user"

import banner from "../images/trading.webp"
export const ROUTE_PATH = "/the-exchange"

const PAGE_SIZE = 16

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const pageParam = parseInt(url.searchParams.get("pg") || "1", 10)
  const searchQuery = url.searchParams.get("q")?.trim() || ""
  const pageSize = PAGE_SIZE

  const initialPage = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam
  const initialSkip = (initialPage - 1) * pageSize

  let { perfumes: availablePerfumes, meta: pagination } =
    await getAvailablePerfumesForDecantingPaginated({
      skip: initialSkip,
      take: pageSize,
      search: searchQuery || undefined,
    })

  const needsRefetch =
    pagination.totalCount > 0 &&
    availablePerfumes.length === 0 &&
    pagination.totalPages > 0 &&
    initialSkip >= pagination.totalCount

  if (needsRefetch) {
    const lastPage = pagination.totalPages
    const adjustedSkip = (lastPage - 1) * pageSize
    const adjusted = await getAvailablePerfumesForDecantingPaginated({
      skip: adjustedSkip,
      take: pageSize,
      search: searchQuery || undefined,
    })
    availablePerfumes = adjusted.perfumes
    pagination = adjusted.meta
  }

  if (pagination.totalCount === 0) {
    pagination = {
      ...pagination,
      currentPage: 1,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
      hasMore: false,
    }
  }

  return { availablePerfumes, pagination, searchQuery }
}

export const meta: MetaFunction = () => [
  { title: "The Exchange - Trading Post" },
  {
    name: "description",
    content: "Browse available perfumes for trading and decanting",
  },
]

const TradingPostPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { availablePerfumes, pagination, searchQuery } = useLoaderData<typeof loader>()
  const [localSearchValue, setLocalSearchValue] = useState(searchQuery)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const getTradePreferenceLabel = (preference: string | null | undefined) => {
    switch (preference) {
      case "cash":
        return t("traderProfile.preferences.cash")
      case "trade":
        return t("traderProfile.preferences.trade")
      case "both":
        return t("traderProfile.preferences.both")
      default:
        return t("traderProfile.preferences.cash")
    }
  }

  // Sync local state when URL search param changes (e.g., back/forward navigation)
  // Also clear any pending debounce timer to prevent stale closures from executing
  useEffect(() => {
    setLocalSearchValue(searchQuery)
    
    // Clear any pending debounce timer when searchQuery changes from navigation
    // This prevents stale closures from executing after back/forward navigation
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
  }, [searchQuery])

  // Debounced search - navigates to URL with search param
  const handleSearchChange = (value: string) => {
    setLocalSearchValue(value)

    // Clear previous debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Set new debounce timer
    debounceRef.current = setTimeout(() => {
      const nextSearch = new URLSearchParams()
      if (value.trim()) {
        nextSearch.set("q", value.trim())
        // Reset to page 1 when searching
      }
      navigate(`${ROUTE_PATH}${nextSearch.toString() ? `?${nextSearch.toString()}` : ""}`, {
        preventScrollReset: true,
      })
    }, 300)
  }

  // Cleanup debounce timer on unmount
  useEffect(() => () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }, [])

  const handlePageChange = (page: number) => {
    // Clear any pending debounce timer to prevent race conditions
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }

    const nextSearch = new URLSearchParams()

    // Use localSearchValue instead of searchQuery to capture current input state
    // This ensures pagination uses the search term the user is currently typing
    if (localSearchValue.trim()) {
      nextSearch.set("q", localSearchValue.trim())
    }

    if (page > 1) {
      nextSearch.set("pg", page.toString())
    }

    navigate(`${ROUTE_PATH}${nextSearch.toString() ? `?${nextSearch.toString()}` : ""}`, {
      preventScrollReset: true,
    })
  }

  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      handlePageChange(pagination.currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (pagination.hasPrevPage) {
      handlePageChange(pagination.currentPage - 1)
    }
  }

  const totalCount = pagination.totalCount ?? availablePerfumes.length
  // Empty exchange = no search query and no results
  const isEmptyExchange = totalCount === 0 && !searchQuery

  return (
    <section>
      <TitleBanner
        image={banner}
        heading={t("tradingPost.heading")}
        subheading={t("tradingPost.subheading")}
      >
        <span className=" block max-w-max rounded-md uppercase font-semibold text-noir-gold-500 mx-auto">
          {totalCount} {t("tradingPost.count")}
        </span>
      </TitleBanner>

      {isEmptyExchange ? (
        <div className="text-center py-8 bg-noir-gray/80 rounded-md mt-8 border-2 border-noir-light">
          <h2 className="text-noir-light font-black text-3xl text-shadow-md text-shadow-noir-dark">
            {t("tradingPost.empty")}
          </h2>
        </div>
      ) : (
        <>
          <div className="inner-container py-6">
            <div className="max-w-md mx-auto mb-6">
              <SearchInput
                value={localSearchValue}
                onChange={handleSearchChange}
                placeholder={t("tradingPost.search.placeholder")}
              />
            </div>
            {availablePerfumes.length === 0 ? (
              <div className="text-center py-8 bg-noir-gray/80 rounded-md border-2 border-noir-light animate-fade-in">
                <h2 className="text-noir-light font-black text-xl text-shadow-md text-shadow-noir-dark">
                  {t("tradingPost.search.noResults")}
                </h2>
                <p className="text-noir-gold-100 mt-2">
                  {t("tradingPost.search.tryDifferent")}
                </p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 auto-rows-fr animate-fade-in">
                {availablePerfumes.map((perfume, index) => (
              <li key={perfume.id} className="relative animate-fade-in-item" style={{ animationDelay: `${index * 0.05}s` }}>
                <LinkCard data={perfume} type="perfume">
                  <div className="mt-2 rounded-md">
                    <p className="text-base font-medium text-noir-gold mb-1">
                      {t("tradingPost.availableFrom")}:
                    </p>

                    {perfume.userPerfume.map(userPerfume => (
                      <div key={userPerfume.id} className="mb-1">
                        <NavLink
                          to={`/trader/${userPerfume.userId}`}
                          className="text-sm font-semibold text-blue-300 hover:text-noir-blue underline"
                          viewTransition
                          prefetch="intent"
                        >
                          {getUserDisplayName(userPerfume.user)}:
                        </NavLink>
                        <span className="text-sm ml-2 text-noir-gold-100">
                          {getPerfumeTypeLabel(userPerfume.type) || "Unknown Type"}{" "}
                          {userPerfume.available} ml
                        </span>
                        {userPerfume.tradePreference && (
                          <span className="text-sm ml-2 text-noir-gold-500 font-medium">
                            • {getTradePreferenceLabel(userPerfume.tradePreference)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </LinkCard>
              </li>
                ))}
              </ul>
            )}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 py-6">
              {pagination.hasPrevPage && (
                <Button onClick={handlePrevPage} variant="secondary" size="sm">
                  Previous
                </Button>
              )}

              <span className="text-noir-gold/80">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>

              {pagination.hasNextPage && (
                <Button onClick={handleNextPage} variant="secondary" size="sm">
                  Next
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default TradingPostPage
