import { useTranslation } from "react-i18next"
import {
  type LoaderFunctionArgs,
  type MetaFunction,
  NavLink,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from "react-router"

import { Button } from "~/components/Atoms/Button"
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
  const pageSize = PAGE_SIZE

  const initialPage = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam
  const initialSkip = (initialPage - 1) * pageSize

  let { perfumes: availablePerfumes, meta: pagination } =
    await getAvailablePerfumesForDecantingPaginated({
      skip: initialSkip,
      take: pageSize,
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

  return { availablePerfumes, pagination }
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
  const [searchParams] = useSearchParams()
  const { availablePerfumes, pagination } = useLoaderData<typeof loader>()

  const handlePageChange = (page: number) => {
    if (page <= 1) {
      navigate(ROUTE_PATH, { preventScrollReset: true })
      return
    }

    const nextSearch = new URLSearchParams(searchParams)
    nextSearch.set("pg", page.toString())
    navigate(`${ROUTE_PATH}?${nextSearch.toString()}`, {
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
  const showEmptyState = totalCount === 0

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

      {showEmptyState ? (
        <div className="text-center py-8 bg-noir-gray/80 rounded-md mt-8 border-2 border-noir-light">
          <h2 className="text-noir-light font-black text-3xl text-shadow-md text-shadow-noir-dark">
            {t("tradingPost.empty")}
          </h2>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 inner-container py-6 auto-rows-fr">
            {availablePerfumes?.map(perfume => (
              <li key={perfume.id} className="relative">
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
                      </div>
                    ))}
                  </div>
                </LinkCard>
              </li>
            ))}
          </ul>

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
