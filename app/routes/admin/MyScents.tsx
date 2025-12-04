import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "react-router"
import { useLoaderData } from "react-router"

import MyScentsListItem from "~/components/Containers/MyScents/MyScentListItem"
import { VirtualScrollList } from "~/components/Molecules/VirtualScrollList"
import AddToCollectionModal from "~/components/Organisms/AddToCollectionModal"
import TitleBanner from "~/components/Organisms/TitleBanner"
import {
  addUserPerfume,
  createDestashEntry,
  getUserPerfumes,
  removeUserPerfume,
  updateAvailableAmount,
} from "~/models/user.server"
import type { UserPerfumeI } from "~/types"
import { sharedLoader } from "~/utils/sharedLoader"

import banner from "../../images/perfume.webp"

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
  // Only set tradeOnly if it was explicitly included in the form
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
      return performRemoveAction(user.id, userPerfumeId)
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
  const { t } = useTranslation()

  useEffect(() => {
    setUserPerfumes(initialUserPerfumes)
  }, [initialUserPerfumes])

  // Group entries by perfumeId - show each perfume only once in the collection
  // Use the oldest entry (original collection entry) as the primary display item
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

  // Render function for virtual scrolling
  const renderUserPerfume = (userPerfume: UserPerfumeI) => (
    <MyScentsListItem
      key={userPerfume.id}
      setUserPerfumes={setUserPerfumes}
      userPerfumes={userPerfumes}
      userPerfume={userPerfume}
    />
  )

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
      <div className="noir-border relative max-w-max mx-auto text-center flex flex-col items-center justify-center gap-4 p-4 my-6">
        <h2 className="mb-2">{t("myScents.collection.heading")}</h2>
        {uniquePerfumes.length === 0 ? (
          <div>
            <p className="text-noir-gold-100 text-xl">
              {t("myScents.collection.empty.heading")}
            </p>
            <p className="text-noir-gold-500 italic">
              {t("myScents.collection.empty.subheading")}
            </p>
          </div>
        ) : uniquePerfumes.length > 10 ? (
          // Use virtual scrolling for large collections
          <VirtualScrollList
            items={uniquePerfumes}
            itemHeight={200}
            containerHeight={600}
            overscan={3}
            className="w-full style-scroll"
            renderItem={renderUserPerfume}
            itemClassName="w-full"
            emptyState={
              <div>
                <p className="text-noir-gold-100 text-xl">
                  {t("myScents.collection.empty.heading")}
                </p>
                <p className="text-noir-gold-500 italic">
                  {t("myScents.collection.empty.subheading")}
                </p>
              </div>
            }
          />
        ) : (
          // Use regular rendering for small collections
          <ul className="w-full">
            {uniquePerfumes.map(userPerfume => renderUserPerfume(userPerfume))}
          </ul>
        )}
      </div>
    </section>
  )
}

export default MyScentsPage
