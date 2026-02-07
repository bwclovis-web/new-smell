import { useTranslation } from "react-i18next"
import {
  type LoaderFunctionArgs,
  type MetaFunction,
  NavLink,
  useLoaderData,
  useLocation,
  useNavigate,
} from "react-router"

import { Button } from "~/components/Atoms/Button"
import PerfumeIcons from "~/components/Containers/Perfume/PerfumeIcons"
import PerfumeNotes from "~/components/Containers/Perfume/PerfumeNotes"
import PerfumeRatingSystem from "~/components/Containers/Perfume/PerfumeRatingSystem"
import { HeroHeader } from "~/components/Molecules/HeroHeader"
import ReviewSection from "~/components/Organisms/ReviewSection"
import { usePerfume } from "~/hooks/usePerfume"
import { useDeletePerfume } from "~/lib/mutations/perfumes"
import { getPerfumeDetailPayload } from "~/models/perfumeDetail.server"
import { getPerfumeBySlug } from "~/models/perfume.server"
import { useSessionStore } from "~/stores/sessionStore"
import { assertExists } from "~/utils/errorHandling.patterns"
import { withLoaderErrorHandling } from "~/utils/errorHandling.server"
import { getSessionFromRequest } from "~/utils/session-from-request.server"

import { ROUTE_PATH as HOUSE_PATH } from "./perfume-house"
import { ROUTE_PATH as ALL_PERFUMES } from "./the-vault"
export const ROUTE_PATH = "/perfume"
const REVIEWS_PAGE_SIZE = 5

export const loader = withLoaderErrorHandling(
  async ({ params, request }: LoaderFunctionArgs) => {
    const perfumeSlug = assertExists(params.perfumeSlug, "Perfume slug", {
      route: "perfume",
      params,
    })

    // Fetch session and perfume in parallel (one cookie parse, no redundant lookups)
    const [session, perfumeOrNull] = await Promise.all([
      getSessionFromRequest(request, { includeUser: true }),
      getPerfumeBySlug(perfumeSlug),
    ])

    const perfume = assertExists(perfumeOrNull, "Perfume", { perfumeSlug })
    const user = session?.user ?? null

    // Single batched call: ratings, reviews, and user-specific data (wishlist, rating, review)
    const payload = await getPerfumeDetailPayload(
      perfume.id,
      session?.userId ?? null,
      REVIEWS_PAGE_SIZE
    )

    return {
      perfume,
      user,
      isInUserWishlist: payload.isInUserWishlist,
      userRatings: payload.userRatings,
      averageRatings: payload.averageRatings,
      userReview: payload.userReview,
      reviewsData: payload.reviewsData,
      reviewsPageSize: REVIEWS_PAGE_SIZE,
    }
  },
  {
    context: { route: "perfume", page: "detail" },
  }
)

export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t("singlePerfume.meta.title") },
    { name: "description", content: t("singlePerfume.meta.description") },
  ]
}

const PerfumePage = () => {
  const loaderData = useLoaderData<typeof loader>()
  const {
    perfume: initialPerfume,
    user,
    isInUserWishlist,
    userRatings,
    averageRatings,
    userReview,
    reviewsData,
    reviewsPageSize,
  } = loaderData
  
  // Hydrate perfume query with loader data
  const { data: perfume } = usePerfume(initialPerfume.slug, initialPerfume)
  
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const { closeModal } = useSessionStore()
  // Get selectedLetter and sourcePage from navigation state
  const selectedLetter = (location.state as { selectedLetter?: string })
    ?.selectedLetter
  const sourcePage = (location.state as { sourcePage?: string })?.sourcePage

  // Use TanStack Query mutation for delete perfume
  const deletePerfume = useDeletePerfume()

  const handleDelete = async () => {
    if (!perfume) {
      return
    }
    
    deletePerfume.mutate(
      { perfumeId: perfume.id },
      {
        onSuccess: () => {
          closeModal()
          navigate(ALL_PERFUMES)
        },
        onError: error => {
          console.error("Failed to delete perfume:", error)
          alert("Failed to delete perfume. Please try again.")
        },
      }
    )
  }

  const handleBack = () => {
    if (sourcePage === "vault") {
      // Navigate back to vault
      if (selectedLetter) {
        navigate(`/the-vault/${selectedLetter.toLowerCase()}`)
      } else {
        navigate(ALL_PERFUMES)
      }
    } else {
      // Default to behind-the-bottle (for houses or fallback)
      if (selectedLetter) {
        navigate(`/behind-the-bottle/${selectedLetter.toLowerCase()}`)
      } else {
        navigate("/behind-the-bottle")
      }
    }
  }

  if (!perfume) {
    return <div className="p-4">Perfume not found</div>
  }

  return (
    <section className="relative z-10 min-h-screen">
      <PerfumeHeader
        perfume={perfume}
        t={t}
        onBack={handleBack}
        selectedLetter={selectedLetter}
      />
      <PerfumeContent
        perfume={perfume}
        user={user}
        isInUserWishlist={isInUserWishlist}
        userRatings={userRatings}
        averageRatings={averageRatings}
        userReview={userReview}
        initialReviewsData={reviewsData}
        reviewsPageSize={reviewsPageSize}
        handleDelete={handleDelete}
        onBack={handleBack}
        selectedLetter={selectedLetter}
        sourcePage={sourcePage}
      />
    </section>
  )
}

const PerfumeHeader = ({
  perfume,
  t,
}: {
  perfume: any
  t: any
  onBack: () => void
  selectedLetter?: string | null
}) => (
  <HeroHeader
    title={perfume.name}
    image={perfume.image ?? undefined}
    imageAlt={perfume.name}
    transitionKey={perfume.id}
    viewTransitionName={`perfume-image-${perfume.id}`}
  >
    <h1 className="capitalize">{perfume.name}</h1>
    <p className="text-lg tracking-wide mt-2 text-noir-gold-500">
      {t("singlePerfume.subheading")}
      <NavLink
        className="text-blue-200 hover:underline font-semibold underline"
        viewTransition
        to={`${HOUSE_PATH}/${perfume?.perfumeHouse?.slug}`}
      >
        {perfume?.perfumeHouse?.name}
      </NavLink>
    </p>
  </HeroHeader>
)

const PerfumeContent = ({
  perfume,
  user,
  isInUserWishlist,
  userRatings,
  averageRatings,
  userReview,
  initialReviewsData,
  reviewsPageSize,
  handleDelete,
  onBack,
  selectedLetter,
  sourcePage,
}: {
  perfume: any
  user: any
  isInUserWishlist: boolean
  userRatings: any
  averageRatings: any
  userReview: any
  initialReviewsData: any
  reviewsPageSize: number
  handleDelete: () => void
  onBack: () => void
  selectedLetter?: string | null
  sourcePage?: string
}) => (
  <div className="flex flex-col gap-20 mx-auto inner-container items-center">
    <div className="w-full flex flex-col lg:flex-row gap-4 max-w-6xl">
      {user && (
        <PerfumeIcons
          perfume={perfume}
          handleDelete={handleDelete}
          userRole={user.role}
          isInWishlist={isInUserWishlist}
        />
      )}
      <div className={`bg-white/5 ${user ? "lg:w-3/4" : "md:w-full"} border-4 noir-border relative shadow-lg text-noir-gold-500`}>
        <PerfumeNotes
          perfumeNotesOpen={perfume.perfumeNotesOpen}
          perfumeNotesHeart={perfume.perfumeNotesHeart}
          perfumeNotesClose={perfume.perfumeNotesClose}
        />
        <p className="p-4 mb-14">{perfume.description}</p>
        <Button
          onClick={onBack}
          variant="primary"
          background="gold"
          size="sm"
          className="gap-2 max-w-max absolute bottom-4 left-4 z-20"
          aria-label={
            selectedLetter
              ? `Back to ${
                  sourcePage === "vault" ? "perfumes" : "houses"
                } starting with ${selectedLetter}`
              : `Back to ${sourcePage === "vault" ? "perfumes" : "houses"}`
          }
        >
          ← Back{" "}
          {selectedLetter
            ? `to ${selectedLetter}`
            : `to ${sourcePage === "vault" ? "Perfumes" : "Houses"}`}
        </Button>
      </div>
    </div>

    <div className="w-full flex flex-col lg:flex-row gap-4 items-start justify-center">
      <div className="noir-border relative w-full lg:w-1/3">
        <PerfumeRatingSystem
          perfumeId={perfume.id}
          userId={user?.id || "anonymous"}
          userRatings={userRatings}
          averageRatings={averageRatings}
        />
      </div>
      <div className="noir-border relative w-full lg:w-3/4 p-4">
        <ReviewSection
          perfumeId={perfume.id}
          currentUserId={user?.id}
          currentUserRole={user?.role}
          canCreateReview={user && (user.role === "admin" || user.role === "editor")}
          existingUserReview={userReview}
          initialReviewsData={initialReviewsData}
          pageSize={reviewsPageSize}
        />
      </div>
    </div>
  </div>
)

export default PerfumePage
