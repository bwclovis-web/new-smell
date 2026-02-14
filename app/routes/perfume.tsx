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
import { OptimizedImage } from "~/components/Atoms/OptimizedImage"
import PerfumeIcons from "~/components/Containers/Perfume/PerfumeIcons"
import PerfumeNotes from "~/components/Containers/Perfume/PerfumeNotes"
import PerfumeRatingSystem from "~/components/Containers/Perfume/PerfumeRatingSystem"
import { HeroHeader } from "~/components/Molecules/HeroHeader"
import ReviewSection from "~/components/Organisms/ReviewSection"
import { usePerfume } from "~/hooks/usePerfume"
import { useDeletePerfume } from "~/lib/mutations/perfumes"
import { getPerfumeDetailPayload } from "~/models/perfumeDetail.server"
import { getPerfumeBySlug } from "~/models/perfume.server"
import { rulesRecommendationService } from "~/services/recommendations"
import { useSessionStore } from "~/stores/sessionStore"
import { assertExists } from "~/utils/errorHandling.patterns"
import { withLoaderErrorHandling } from "~/utils/server/errorHandling.server"
import { validImageRegex } from "~/utils/styleUtils"
import { getSessionFromRequest } from "~/utils/session-from-request.server"

import bottleBanner from "~/images/single-bottle.webp"
import { ROUTE_PATH as HOUSE_PATH } from "./perfume-house"
import { ROUTE_PATH as ALL_PERFUMES } from "./the-vault"
export const ROUTE_PATH = "/perfume"
const REVIEWS_PAGE_SIZE = 5
const SIMILAR_PERFUMES_LIMIT = 4

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

    // Critical payload must succeed; similar perfumes are non-blocking (new recommendation service)
    const [payload, similarPerfumes] = await Promise.all([
      getPerfumeDetailPayload(
        perfume.id,
        session?.userId ?? null,
        REVIEWS_PAGE_SIZE
      ),
      rulesRecommendationService
        .getSimilarPerfumes(perfume.id, SIMILAR_PERFUMES_LIMIT)
        .catch((err) => {
          console.warn("[perfume] getSimilarPerfumes failed, showing none:", err?.message ?? err)
          return []
        }),
    ])

    return {
      perfume,
      user,
      isInUserWishlist: payload.isInUserWishlist,
      userRatings: payload.userRatings,
      averageRatings: payload.averageRatings,
      userReview: payload.userReview,
      reviewsData: payload.reviewsData,
      reviewsPageSize: REVIEWS_PAGE_SIZE,
      similarPerfumes,
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
    similarPerfumes = [],
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
        similarPerfumes={similarPerfumes}
        handleDelete={handleDelete}
        onBack={handleBack}
        selectedLetter={selectedLetter}
        sourcePage={sourcePage}
        t={t}
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
  similarPerfumes,
  handleDelete,
  onBack,
  selectedLetter,
  sourcePage,
  t,
}: {
  perfume: any
  user: any
  isInUserWishlist: boolean
  userRatings: any
  averageRatings: any
  userReview: any
  initialReviewsData: any
  reviewsPageSize: number
  similarPerfumes: { id: string; name: string; slug: string; image?: string | null; perfumeHouse?: { name: string; slug: string } | null }[]
  handleDelete: () => void
  onBack: () => void
  selectedLetter?: string | null
  sourcePage?: string
  t: (key: string, options?: { defaultValue?: string; name?: string }) => string
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

    {similarPerfumes.length > 0 && (
      <div className="w-full max-w-6xl">
        <h2 className="text-center mb-4 text-noir-gold-500">
          {t("singlePerfume.similarPerfumes", { defaultValue: "Similar perfumes" })}
        </h2>
        <ul className="grid grid-cols-1 md:grid-cols-4 gap-4 p-2">
          {similarPerfumes.map((similar) => (
            <li key={similar.id}>
              <NavLink
                viewTransition
                prefetch="intent"
                to={`/perfume/${similar.slug}`}
                state={selectedLetter ? { selectedLetter } : {}}
                className="block p-2 h-full noir-border relative w-full transition-colors duration-300 ease-in-out hover:bg-white/5"
              >
                <h3 className="text-center block text-sm tracking-wide py-2 font-semibold text-noir-gold leading-tight capitalize line-clamp-2">
                  {similar.name}
                </h3>
                <OptimizedImage
                  src={(!validImageRegex.test(similar.image ?? "") ? similar.image : null) ?? bottleBanner}
                  alt={t("singlePerfume.perfumeBottleAltText", {
                    defaultValue: "Perfume Bottle {{name}}",
                    name: similar.name,
                  })}
                  priority={false}
                  width={128}
                  height={128}
                  quality={75}
                  className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg mb-2 mx-auto dark:brightness-90"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  viewTransitionName={`perfume-image-${similar.id}`}
                  placeholder="blur"
                />
                {similar.perfumeHouse && (
                  <p className="text-center text-xs text-noir-gold-500/80 truncate">
                    {similar.perfumeHouse.name}
                  </p>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
)

export default PerfumePage
