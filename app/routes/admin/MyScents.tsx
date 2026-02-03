import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "react-router"
import { NavLink, useLoaderData, useLocation } from "react-router"

import SearchInput from "~/components/Molecules/SearchInput/SearchInput"
import bottleBanner from "~/images/single-bottle.webp"
import AddToCollectionModal from "~/components/Organisms/AddToCollectionModal"
import TitleBanner from "~/components/Organisms/TitleBanner"
import {
  addUserPerfume,
  createDestashEntry,
  getUserPerfumeById,
  getUserPerfumes,
  removeUserPerfume,
  updateAvailableAmount,
} from "~/models/user.server"
import type { UserPerfumeI } from "~/types"
import { processWishlistAvailabilityAlerts } from "~/utils/alert-processors"
import { sharedLoader } from "~/utils/sharedLoader"

import banner from "../../images/perfume.webp"
import { OptimizedImage } from "~/components/Atoms/OptimizedImage"
import { validImageRegex } from "~/utils/styleUtils"

export const ROUTE_PATH = "/admin/my-scents"

export const meta: MetaFunction = () => [
  { title: "My Scents - Shadow and Sillage" },
  {
    name: "description",
    content: "Manage your personal collection of perfumes.",
  },
]
interface LoaderData {
  userPerfumes: UserPerfumeI[]
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await sharedLoader(request)
  const userPerfumes = await getUserPerfumes(user.id)

  return { userPerfumes }
}
interface AddParams {
  userId: string
  perfumeId: string
  amount?: string
  price?: string
  placeOfPurchase?: string
}

const performAddAction = async ({
  userId,
  perfumeId,
  amount,
  price,
  placeOfPurchase,
}: AddParams) => await addUserPerfume({
    userId,
    perfumeId,
    amount,
    price,
    placeOfPurchase,
  })

const performRemoveAction = async (
  userId: string,
  userPerfumeId: string
) => await removeUserPerfume(userId, userPerfumeId)

const performDecantAction = async (params: {
  userId: string
  userPerfumeId: string
  availableAmount: string
  tradePrice?: string
  tradePreference?: string
  tradeOnly?: boolean
}) => {
  const updateParams: {
    userId: string
    userPerfumeId: string
    availableAmount: string
    tradePrice?: string
    tradePreference?: string
    tradeOnly?: boolean
  } = {
    userId: params.userId,
    userPerfumeId: params.userPerfumeId,
    availableAmount: params.availableAmount,
  }

  if (params.tradePrice !== undefined) {
    updateParams.tradePrice = params.tradePrice
  }
  if (params.tradePreference !== undefined) {
    updateParams.tradePreference = params.tradePreference
  }
  if (params.tradeOnly !== undefined) {
    updateParams.tradeOnly = params.tradeOnly
  }

  return await updateAvailableAmount(updateParams)
}

const handleDecantAction = async (
  formData: FormData,
  userId: string
) => {
  const userPerfumeId = formData.get("userPerfumeId") as string
  const availableAmount = formData.get("availableAmount") as string | undefined
  
  // Only include optional fields if they're actually provided in the form
  const tradePriceRaw = formData.get("tradePrice")
  const tradePreferenceRaw = formData.get("tradePreference")
  const tradeOnlyRaw = formData.get("tradeOnly")
  
  const tradePrice = tradePriceRaw ? String(tradePriceRaw) : undefined
  const tradePreference = tradePreferenceRaw ? String(tradePreferenceRaw) : undefined
  const tradeOnly = tradeOnlyRaw !== null ? tradeOnlyRaw === "true" : undefined

  if (!userPerfumeId) {
    throw new Response("userPerfumeId is required for decant action", {
      status: 400,
    })
  }

  if (!availableAmount) {
    throw new Response("availableAmount is required for decant action", {
      status: 400,
    })
  }

  const result = await performDecantAction({
    userId,
    userPerfumeId,
    availableAmount,
    tradePrice,
    tradePreference,
    tradeOnly,
  })

  // Process wishlist availability alerts when a perfume becomes available for trade
  if (result.success && availableAmount && parseFloat(availableAmount) > 0) {
    // Get the perfumeId from the userPerfume
    const userPerfume = await getUserPerfumeById(userPerfumeId)
    if (userPerfume?.perfumeId) {
      try {
        await processWishlistAvailabilityAlerts(userPerfume.perfumeId, userId)
      } catch {
        // Don't fail the decant operation if alert processing fails
      }
    }
  }

  // Return as JSON response for consistency
  return new Response(
    JSON.stringify(result),
    {
      status: result.success ? 200 : 400,
      headers: { "Content-Type": "application/json" },
    }
  )
}

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const formData = await request.formData()
    const perfumeId = formData.get("perfumeId") as string
    const userPerfumeId = formData.get("userPerfumeId") as string
    const actionTypeRaw = formData.get("action")
    const actionType = actionTypeRaw ? String(actionTypeRaw).trim() : null
    const amount = formData.get("amount") as string | undefined
    const price = formData.get("price") as string | undefined
    const placeOfPurchase = formData.get("placeOfPurchase") as string | undefined
    const user = await sharedLoader(request)

    if (!actionType) {
      return new Response(
        JSON.stringify({ success: false, error: "Action is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const normalizedAction = actionType.trim().toLowerCase()

    if (normalizedAction === "add") {
      return performAddAction({
        userId: user.id,
        perfumeId,
        amount,
        price,
        placeOfPurchase,
      })
    }

    if (normalizedAction === "remove") {
      if (!userPerfumeId) {
        return new Response(
          JSON.stringify({ success: false, error: "userPerfumeId is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        )
      }
      const result = await performRemoveAction(user.id, userPerfumeId)
      return new Response(
        JSON.stringify(result),
        {
          status: result.success ? 200 : 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    if (normalizedAction === "decant") {
      return handleDecantAction(formData, user.id)
    }

    if (normalizedAction === "create-decant") {
      return await handleCreateDecantAction(formData, user.id)
    }

    return new Response(
      JSON.stringify({ success: false, error: `Invalid action: ${actionType}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    if (error instanceof Response) {
      throw error
    }
    throw new Response(
      `Action error: ${error instanceof Error ? error.message : String(error)}`,
      { status: 500 }
    )
  }
}

const handleCreateDecantAction = async (
  formData: FormData,
  userId: string
) => {
  const perfumeId = formData.get("perfumeId") as string
  const decantAmount = formData.get("amount") as string | undefined
  const tradePrice = formData.get("tradePrice") as string | undefined
  const tradePreference = formData.get("tradePreference") as string | undefined
  const tradeOnly = formData.get("tradeOnly") === "true"

  if (!perfumeId) {
    throw new Response("perfumeId is required for create-decant action", {
      status: 400,
    })
  }

  if (!decantAmount) {
    throw new Response("amount is required for create-decant action", {
      status: 400,
    })
  }

  const result = await createDestashEntry({
    userId,
    perfumeId,
    available: decantAmount,
    tradePrice,
    tradePreference,
    tradeOnly,
  })

  if (!result.success) {
    throw new Response(
      result.error || "Failed to create destash entry",
      { status: 400 }
    )
  }

  // Process wishlist availability alerts when a new decant becomes available
  if (decantAmount && parseFloat(decantAmount) > 0) {
    try {
      await processWishlistAvailabilityAlerts(perfumeId, userId)
    } catch {
      // Don't fail the decant operation if alert processing fails
    }
  }

  return new Response(
    JSON.stringify(result),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  )
}

const MyScentsPage = () => {
  const { userPerfumes: initialUserPerfumes } = useLoaderData() as LoaderData
  const [userPerfumes, setUserPerfumes] = useState(initialUserPerfumes)
  const [searchQuery, setSearchQuery] = useState("")
  const { t } = useTranslation()
  const location = useLocation()
  const selectedLetter = (location.state as { selectedLetter?: string })
    ?.selectedLetter
  useEffect(() => {
    setUserPerfumes(initialUserPerfumes)
  }, [initialUserPerfumes])

  const groupedPerfumes = userPerfumes.reduce((acc, up) => {
    if (!acc[up.perfumeId]) {
      acc[up.perfumeId] = up
    } else {
      // Keep the oldest entry as the primary (original collection entry)
      const existing = acc[up.perfumeId]
      if (new Date(up.createdAt) < new Date(existing.createdAt)) {
        acc[up.perfumeId] = up
      }
    }
    return acc
  }, {} as Record<string, UserPerfumeI>)

  const uniquePerfumes = Object.values(groupedPerfumes)

  const filteredPerfumes = useMemo(() => {
    if (!searchQuery.trim()) {
      return uniquePerfumes
    }
    const query = searchQuery.toLowerCase()
    return uniquePerfumes.filter(userPerfume => userPerfume.perfume.name.toLowerCase().includes(query))
  }, [uniquePerfumes, searchQuery])

  return (
    <section>
      <TitleBanner
        imagePos="object-bottom"
        image={banner}
        heading={t("myScents.heading")}
        subheading={t("myScents.subheading")}
      >
        <AddToCollectionModal />
      </TitleBanner>
      <div className="noir-border relative inner-container mx-auto text-center flex flex-col items-center justify-center gap-4 p-4 my-6">
        <h2 className="mb-2">{t("myScents.collection.heading")}</h2>
        {uniquePerfumes.length > 0 && (
          <div className="w-full mb-4">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t("myScents.search.placeholder")}
            />
          </div>
        )}
        {uniquePerfumes.length === 0 ? (
          <div>
            <p className="text-noir-gold-100 text-xl">
              {t("myScents.collection.empty.heading")}
            </p>
            <p className="text-noir-gold-500 italic">
              {t("myScents.collection.empty.subheading")}
            </p>
          </div>
        ) : filteredPerfumes.length === 0 ? (
          <div className="animate-fade-in">
            <p className="text-noir-gold-100 text-xl">
              {t("myScents.search.noResults")}
            </p>
            <p className="text-noir-gold-500 italic">
              {t("myScents.search.tryDifferent")}
            </p>
          </div>
        ) : (
          <div className="animate-fade-in">
            <ul className="w-full animate-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[auto-fill_minmax(900px,_1fr)] gap-4">
              {filteredPerfumes.map((userPerfume) => {
                const {perfume} = userPerfume
                return(
                <li key={userPerfume.id} className="flex flex-col items-center justify-center 
                border-4 border-double border-noir-gold p-1">
                  <NavLink 
                  viewTransition
                  prefetch="intent"
                  to={`/admin/my-single-scent/${userPerfume.id}`}
                  state={selectedLetter ? { selectedLetter } : {}}
                  >
                    <OptimizedImage
                    src={!validImageRegex.test(perfume.image) ? perfume.image : bottleBanner}
                    alt={t("singlePerfume.perfumeBottleAltText", {
                      defaultValue: "Perfume Bottle {{name}}",
                      name: perfume.name,
                    })}
                    priority={false}
                    width={192}
                    height={192}
                    quality={75}
                    className="w-48 h-48 object-cover rounded-lg mb-2 mx-auto dark:brightness-90"
                    sizes="(max-width: 768px) 50vw, 33vw"
                    viewTransitionName={`perfume-image-${perfume.id}`}
                    placeholder="blur"
                  />
                  <span className="text-noir-gold">{userPerfume.perfume.name}</span>
                  </NavLink>
                </li>
              )})}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
export default MyScentsPage
