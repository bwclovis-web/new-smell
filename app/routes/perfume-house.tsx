import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { GrEdit } from "react-icons/gr"
import { MdDeleteForever } from "react-icons/md"
import {
  type LoaderFunctionArgs,
  type MetaFunction,
  NavLink,
  useLoaderData,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router"

  import { VooDooLink } from "~/components/Atoms/Button"
import { Button } from "~/components/Atoms/Button"
import { OptimizedImage } from "~/components/Atoms/OptimizedImage"
import PerfumeHouseAddressBlock from "~/components/Containers/PerfumeHouse/AddressBlock/PerfumeHouseAddressBlock"
import DangerModal from "~/components/Organisms/DangerModal"
import Modal from "~/components/Organisms/Modal"
import { useHouse } from "~/hooks/useHouse"
import { useInfinitePerfumesByHouse } from "~/hooks/useInfinitePerfumes"
import { useDeleteHouse } from "~/lib/mutations/houses"
import { getPerfumeHouseBySlug } from "~/models/house.server"
import { useSessionStore } from "~/stores/sessionStore"
const ALL_HOUSES = "/behind-the-bottle"
const BEHIND_THE_BOTTLE = "/behind-the-bottle"
export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.houseSlug) {
    throw new Error("House slug is required")
  }
  const perfumeHouse = await getPerfumeHouseBySlug(params.houseSlug, {
    skip: 0,
    take: 9,
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

// Main component
const HouseDetailPage = () => {
  const loaderData = useLoaderData<typeof loader>()
  const { perfumeHouse: initialHouse } = loaderData
  const initialPerfumeCount =
    typeof (initialHouse as any).perfumeCount === "number"
      ? (initialHouse as any).perfumeCount
      : (initialHouse as any)._count?.perfumes ??
        initialHouse.perfumes?.length ??
        0
  const initialPerfumes = (initialHouse.perfumes || []) as any
  
  // Hydrate house query with loader data
  const { data: perfumeHouse } = useHouse(
    initialHouse.slug,
    initialHouse
  )
  
  const { user } = useOutletContext<OutletContextType>()
  const navigate = useNavigate()
  const location = useLocation()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { modalOpen, toggleModal, modalId, closeModal } = useSessionStore()
  // Get selectedLetter from navigation state
  const selectedLetter = (location.state as { selectedLetter?: string })
    ?.selectedLetter
  
  if (!perfumeHouse) {
    return <div className="p-4">House not found</div>
  }
  const derivedPerfumeCount =
    typeof (perfumeHouse as any).perfumeCount === "number"
      ? (perfumeHouse as any).perfumeCount
      : (perfumeHouse as any)._count?.perfumes
  const totalPerfumeCount = derivedPerfumeCount ?? initialPerfumeCount

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error: queryError,
  } = useInfinitePerfumesByHouse({
    houseSlug: perfumeHouse.slug,
    initialData: initialPerfumes,
    initialTotalCount: totalPerfumeCount,
  })

  // Flatten pages to get all perfumes
  const perfumes = data?.pages.flatMap((page) => page.perfumes || []) || []
  const loading = isLoading || isFetchingNextPage
  const hasMore = hasNextPage ?? false
  const observerRef = useRef<HTMLDivElement>(null)

  const loadMorePerfumes = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage()
    }
  }

  // Prefetch next page when available for better UX
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && data) {
      // Prefetch next page after current data is loaded
      const timer = setTimeout(() => {
        fetchNextPage().catch(() => {
          // Silently fail - prefetch is just an optimization
        })
      }, 2000) // Wait 2 seconds before prefetching

      return () => clearTimeout(timer)
    }
  }, [hasNextPage, isFetchingNextPage, data, fetchNextPage])

  // Use TanStack Query mutation for delete house
  const deleteHouse = useDeleteHouse()

  // Handle delete house
  const handleDelete = async () => {
    deleteHouse.mutate(
      { houseId: perfumeHouse.id },
      {
        onSuccess: () => {
          closeModal()
          navigate(ALL_HOUSES)
        },
        onError: (error) => {
          console.error("Failed to delete house:", error)
          alert("Failed to delete house. Please try again.")
        },
      }
    )
  }

  return (
    <>
    {modalOpen && modalId === "delete-perfume-house-item" && (
      <Modal innerType="dark" animateStart="top">
        <DangerModal
        heading="Are you sure you want to delete this perfume house?"
        description="Once deleted, you will lose all perfumes and history associated with this house."
        action={handleDelete} />

      </Modal>
    )} 
    <section className="relative z-10 my-4">
      {/* Back Button */}

      <header className="flex items-end justify-center mb-10 relative h-[600px]">
        {perfumeHouse.image ? (
          <OptimizedImage
            src={perfumeHouse.image}
            alt={perfumeHouse.name}
            priority={true}
            width={1200}
            height={600}
            quality={85}
            className="w-full h-full object-cover mb-2 rounded-lg absolute top-0 left-0 right-0 z-0 details-title filter contrast-[1.4] brightness-[0.9] sepia-[0.2] mix-blend-screen mask-linear-gradient-to-b"
            sizes="100vw"
            viewTransitionName={`perfume-image-${perfumeHouse.id}`}
            placeholder="blur"
          />
        ) : (
          <div className="w-full h-full bg-noir-dark/50 rounded-lg absolute top-0 left-0 right-0 z-0 flex items-center justify-center">
            <span className="text-noir-gold/40">No Image</span>
          </div>
        )}

        <div className="relative z-10 px-8 text-center filter w-full rounded-lg py-4 text-shadow-lg text-shadow-noir-black/90">
          <h1 className="text-noir-gold">{perfumeHouse.name}</h1>
        </div>
      </header>

      <div className="flex flex-col gap-20 mx-auto max-w-6xl">
        {user?.role === "admin" && (
          <div>
            <h3 className="text-lg font-semibold text-center text-noir-gold-500 mb-2">
              Admin
            </h3>
            <div className="flex flex-col items-center justify-between gap-2">
              <VooDooLink
                aria-label={`edit ${perfumeHouse.name}`}
                variant="icon"
                background={"gold"}
                size={"sm"}
                className="flex items-center justify-between gap-2"
                url={`/admin/perfume-house/${perfumeHouse.slug}/edit`}
              >
                <span>Edit Perfume</span>
                <GrEdit size={22} />
              </VooDooLink>
              <Button
                onClick={() => {
                  const buttonRef = { current: document.createElement("button") }
                  toggleModal(buttonRef as any, "delete-perfume-house-item", "delete-perfume-house-item")
                }}
                aria-label={`delete ${perfumeHouse.name}`}
                variant="icon"
                className="flex items-center justify-between gap-2"
                background={"gold"}
                size={"sm"}
              >
                <span>Delete Perfume</span>
                <MdDeleteForever size={22} />
              </Button>
            </div>
          </div>
        )}
        <div className="noir-border relative bg-white/5 text-noir-gold-500">
          <PerfumeHouseAddressBlock perfumeHouse={perfumeHouse} />
          {perfumeHouse.description && (
            <p className="px-4 pt-4">{perfumeHouse.description}</p>
          )}
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pb-4 pt-4">
            <span className="text-xs uppercase tracking-[0.3em] text-noir-gold/70">
              Total perfumes
            </span>
            <span
              className="text-2xl font-semibold text-noir-gold"
              data-testid="perfume-count"
            >
              {totalPerfumeCount}
            </span>
          </div>
          <span className="tag absolute">{perfumeHouse.type}</span>
          <Button
            onClick={() => navigate(selectedLetter
                  ? `/behind-the-bottle/${selectedLetter.toLowerCase()}`
                  : BEHIND_THE_BOTTLE)
            }
            variant="primary"
            background="gold"
            size="sm"
            className="gap-2 max-w-max ml-2 mb-2 mt-2"
            aria-label={
              selectedLetter
                ? `Back to houses starting with ${selectedLetter}`
                : "Back to houses"
            }
          >
            ← Back to {selectedLetter || "Houses"}
          </Button>
        </div>
        {perfumes.length > 0 && (
          <div
            ref={scrollContainerRef}
            className=" rounded-b-lg max-h-[800px] overflow-y-auto w-full relative overflow-x-hidden style-scroll"
          >
            <h2 className="text-center mb-4">Perfumes</h2>
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-3 p-2 pb-4">
              {perfumes.map((perfume: any) => (
                <li key={perfume.id}>
                  <NavLink
                    viewTransition
                    prefetch="intent"
                    to={`/perfume/${perfume.slug}`}
                    state={selectedLetter ? { selectedLetter } : {}}
                    className="block p-2 h-full noir-border relative w-full transition-colors duration-300 ease-in-out"
                  >
                    <h3
                      className="
                      text-center block text-lg tracking-wide py-2
                      font-semibold text-noir-gold  leading-6 capitalize"
                    >
                      {perfume.name}
                    </h3>
                    {perfume.image ? (
                      <OptimizedImage
                        src={perfume.image}
                        alt={perfume.name}
                        priority={false}
                        width={192}
                        height={192}
                        quality={75}
                        className="w-48 h-48 object-cover rounded-lg mb-2 mx-auto dark:brightness-90"
                        sizes="(max-width: 768px) 50vw, 33vw"
                        viewTransitionName={`perfume-image-${perfume.id}`}
                        placeholder="blur"
                      />
                    ) : (
                      <div className="w-48 h-48 bg-noir-dark/50 flex items-center justify-center border border-noir-gold/20 rounded-lg mb-2 mx-auto">
                        <span className="text-noir-gold/40 text-xs">No Image</span>
                      </div>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div
              ref={observerRef}
              aria-live="polite"
              aria-busy={loading}
              role="status"
              className="sticky bottom-0 w-full bg-gradient-to-t from-noir-black to-transparent flex flex-col items-center justify-center py-4"
            >
              {loading && <span>Loading more perfumes…</span>}
              {!loading && hasMore && (
                <button
                  onClick={loadMorePerfumes}
                  className="bg-noir-gray text-noir-light px-4 py-2 rounded-md font-semibold hover:bg-noir-dark transition-all"
                >
                  Load More Perfumes
                </button>
              )}
              {!hasMore && <span>No more perfumes to load.</span>}
            </div>
          </div>
        )}
      </div>
    </section>
    </>
  )
}

export default HouseDetailPage
