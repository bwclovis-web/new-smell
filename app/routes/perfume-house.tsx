import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import {
  type LoaderFunctionArgs,
  type MetaFunction,
  useLoaderData,
  useLocation,
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router"

import {
  PerfumeHouseAdminActions,
  PerfumeHouseHero,
  PerfumeHousePerfumeList,
  PerfumeHouseSummaryCard,
} from "~/components/Containers/PerfumeHouse"
import DangerModal from "~/components/Organisms/DangerModal"
import Modal from "~/components/Organisms/Modal"
import { useHouse } from "~/hooks/useHouse"
import { useInfinitePagination } from "~/hooks/useInfinitePagination"
import { useInfinitePerfumesByHouse } from "~/hooks/useInfinitePerfumes"
import {
  usePaginatedNavigation,
  usePreserveScrollPosition,
} from "~/hooks/usePaginatedNavigation"
import { useScrollToDataList } from "~/hooks/useScrollToDataList"
import { useDeleteHouse } from "~/lib/mutations/houses"
import { getPerfumeHouseBySlug } from "~/models/house.server"
import { useSessionStore } from "~/stores/sessionStore"
const ALL_HOUSES = "/behind-the-bottle"
const BEHIND_THE_BOTTLE = "/behind-the-bottle"
const PAGE_SIZE = 9
export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.houseSlug) {
    throw new Error("House slug is required")
  }
  const perfumeHouse = await getPerfumeHouseBySlug(params.houseSlug, {
    skip: 0,
    take: PAGE_SIZE,
  })
  if (!perfumeHouse) {
    throw new Response("House not found", { status: 404 })
  }
  return { perfumeHouse }
}

// Meta data
export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t("singleHouse.meta.title") },
    { name: "description", content: t("singleHouse.meta.description") },
  ]
}

export const ROUTE_PATH = "/perfume-house"

// Types
type OutletContextType = {
  user?: {
    role?: string
  }
}

interface UseHousePerfumePaginationOptions {
  houseSlug: string
  initialPerfumes: any[]
  fallbackPerfumeCount: number
  pageFromUrl: number
  navigate: ReturnType<typeof useNavigate>
}

interface UseHousePerfumePaginationResult {
  perfumes: any[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    pageSize: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  loading: boolean
  handleNextPage: () => void
  handlePrevPage: () => void
  totalPerfumeCount: number
  listError: Error | null
}

function useHousePerfumePagination({
  houseSlug,
  initialPerfumes,
  fallbackPerfumeCount,
  pageFromUrl,
  navigate,
}: UseHousePerfumePaginationOptions): UseHousePerfumePaginationResult {
  const currentPage =
    Number.isNaN(pageFromUrl) || pageFromUrl < 1 ? 1 : pageFromUrl

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useInfinitePerfumesByHouse({
    houseSlug,
    pageSize: PAGE_SIZE,
    initialData: initialPerfumes,
    initialTotalCount: fallbackPerfumeCount,
  })

  const {
    items: perfumes,
    pagination,
    loading,
  } = useInfinitePagination({
    pages: data?.pages,
    currentPage,
    pageSize: PAGE_SIZE,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    extractItems: page => (page as any).perfumes || [],
    extractTotalCount: page => {
      const pageData = page as any
      return (
        pageData?.meta?.totalCount ??
        pageData?._count?.perfumes ??
        pageData?.count
      )
    },
  })

  useEffect(() => {
    if (pagination.totalPages > 0 && currentPage > pagination.totalPages) {
      navigate(
        pagination.totalPages === 1
          ? `${ROUTE_PATH}/${houseSlug}`
          : `${ROUTE_PATH}/${houseSlug}?pg=${pagination.totalPages}`,
        { replace: true, preventScrollReset: true }
      )
    }

    if (pagination.totalCount === 0 && currentPage !== 1) {
      navigate(`${ROUTE_PATH}/${houseSlug}`, {
        replace: true,
        preventScrollReset: true,
      })
    }
  }, [
    currentPage,
    houseSlug,
    navigate,
    pagination.totalCount,
    pagination.totalPages,
  ])

  usePreserveScrollPosition(loading)

  useScrollToDataList({
    trigger: pagination.currentPage,
    enabled: pagination.totalCount > 0,
    isLoading: loading,
    hasData: perfumes.length > 0,
    additionalOffset: 32,
    skipInitialScroll: true,
  })

  const { handleNextPage, handlePrevPage } = usePaginatedNavigation({
    currentPage: pagination.currentPage,
    hasNextPage: pagination.hasNextPage,
    hasPrevPage: pagination.hasPrevPage,
    navigate,
    buildPath: page => (
      page <= 1
        ? `${ROUTE_PATH}/${houseSlug}`
        : `${ROUTE_PATH}/${houseSlug}?pg=${page}`
    ),
  })

  const totalPerfumeCount =
    pagination.totalCount || fallbackPerfumeCount || 0

  const listError =
    error instanceof Error ? error : error ? new Error(String(error)) : null

  return {
    perfumes,
    pagination,
    loading,
    handleNextPage,
    handlePrevPage,
    totalPerfumeCount,
    listError,
  }
}

const getInitialPerfumeData = (house: any) => {
  const perfumes = (house.perfumes || []) as any[]
  const count =
    typeof house?.perfumeCount === "number"
      ? house.perfumeCount
      : house?._count?.perfumes ??
        perfumes.length ??
        0

  return { perfumes, count }
}

interface HouseDetailViewModel {
  perfumeHouse: any
  userRole?: string
  selectedLetter: string | null
  perfumes: any[]
  pagination: UseHousePerfumePaginationResult["pagination"]
  loading: boolean
  totalPerfumeCount: number
  listError: Error | null
  modalOpen: boolean
  modalId: string | null
  handleDelete: () => void
  handleDeleteClick: () => void
  handleBackClick: () => void
  handleNextPage: () => void
  handlePrevPage: () => void
}

function useHouseDetailViewModel(): HouseDetailViewModel | null {
  const { perfumeHouse: initialHouse } = useLoaderData<typeof loader>()
  const { data: perfumeHouse } = useHouse(initialHouse.slug, initialHouse)
  const { user } = useOutletContext<OutletContextType>()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { modalOpen, toggleModal, modalId, closeModal } = useSessionStore()
  

  const selectedLetter =
    (location.state as { selectedLetter?: string })?.selectedLetter ?? null

  if (!perfumeHouse) {
    return null
  }

  const { perfumes: initialPerfumes, count: initialPerfumeCount } =
    getInitialPerfumeData(initialHouse)

  const derivedPerfumeCount =
    typeof (perfumeHouse as any).perfumeCount === "number"
      ? (perfumeHouse as any).perfumeCount
      : (perfumeHouse as any)._count?.perfumes
  const fallbackPerfumeCount = derivedPerfumeCount ?? initialPerfumeCount
  const pageFromUrl = parseInt(searchParams.get("pg") || "1", 10)

  const {
    perfumes,
    pagination,
    loading,
    handleNextPage,
    handlePrevPage,
    totalPerfumeCount,
    listError,
  } = useHousePerfumePagination({
    houseSlug: perfumeHouse.slug,
    initialPerfumes,
    fallbackPerfumeCount,
    pageFromUrl,
    navigate,
  })

  const deleteHouse = useDeleteHouse()

  const handleDelete = () => {
    deleteHouse.mutate(
      { houseId: perfumeHouse.id },
      {
        onSuccess: () => {
          closeModal()
          navigate(ALL_HOUSES)
        },
        onError: error => {
          console.error("Failed to delete house:", error)
          alert("Failed to delete house. Please try again.")
        },
      }
    )
  }

  const handleDeleteClick = () => {
    const buttonRef = { current: document.createElement("button") }
    toggleModal(buttonRef as any, "delete-perfume-house-item")
  }

  const handleBackClick = () => {
    navigate(
      selectedLetter
        ? `/behind-the-bottle/${selectedLetter.toLowerCase()}`
        : BEHIND_THE_BOTTLE,
      { preventScrollReset: true }
    )
  }

  return {
    perfumeHouse,
    userRole: user?.role,
    selectedLetter,
    perfumes,
    pagination,
    loading,
    totalPerfumeCount,
    listError,
    modalOpen,
    modalId,
    handleDelete,
    handleDeleteClick,
    handleBackClick,
    handleNextPage,
    handlePrevPage,
  }
}

// Main component
const HouseDetailPage = () => {
  const viewModel = useHouseDetailViewModel()
  const { t } = useTranslation()

  if (!viewModel) {
    return <div className="p-4">{t("singleHouse.notFound")}</div>
  }

  const {
    perfumeHouse,
    userRole,
    selectedLetter,
    perfumes,
    pagination,
    loading,
    totalPerfumeCount,
    listError,
    modalOpen,
    modalId,
    handleDelete,
    handleDeleteClick,
    handleBackClick,
    handleNextPage,
    handlePrevPage,
  } = viewModel

  return (
    <>
    {modalOpen && modalId === "delete-perfume-house-item" && (
      <Modal innerType="dark" animateStart="top">
        <DangerModal
        heading={t("singleHouse.deleteModal.heading")}
        description={t("singleHouse.deleteModal.description")}
        action={handleDelete} />
      </Modal>
    )} 
    <section className="relative z-10 my-4">
      <PerfumeHouseHero
        name={perfumeHouse.name}
        image={perfumeHouse.image}
        transitionKey={perfumeHouse.id}
      />

      <div className="flex flex-col gap-20 mx-auto max-w-6xl">
        <PerfumeHouseAdminActions
          isAdmin={userRole === "admin"}
          houseName={perfumeHouse.name}
          houseSlug={perfumeHouse.slug}
          onDeleteClick={handleDeleteClick}
        />

        <PerfumeHouseSummaryCard
          perfumeHouse={perfumeHouse}
          totalPerfumeCount={totalPerfumeCount}
          selectedLetter={selectedLetter}
          onBackClick={handleBackClick}
        />

        <PerfumeHousePerfumeList
          perfumes={perfumes}
          loading={loading}
          pagination={pagination}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
          selectedLetter={selectedLetter}
          queryError={listError}
        />
      </div>
    </section>
    </>
  )
}

export default HouseDetailPage
