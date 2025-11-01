import { useState } from "react"
import { useTranslation } from "react-i18next"
import { IoMdCloseCircle } from "react-icons/io"
import { Form, NavLink } from "react-router"

import VooDooCheck from "~/components/Atoms/VooDooCheck/VooDooCheck"
import { useCSRF } from "~/hooks/useCSRF"
import { styleMerge } from "~/utils/styleUtils"
import { safeAsync } from "~/utils/errorHandling.patterns"

import {
  wishlistAddedVariants,
  wishlistHouseVariants,
  wishlistVariants,
  wishlistVisibilityVariants,
} from "./wishlist-variants"
import WishListAvailabilityInfo from "./WishlistAvbalibilityInfo"

interface WishlistItemCardProps {
  item: any
  isAvailable: boolean
  availableAmount: number
}

const WishlistItemCard = ({
  item,
  isAvailable,
  availableAmount,
}: WishlistItemCardProps) => {
  const [isPublic, setIsPublic] = useState(item.isPublic)
  const { addToHeaders } = useCSRF()
  const { t } = useTranslation()

  const handleVisibilityToggle = async () => {
    const newVisibility = !isPublic
    // Optimistically update UI
    setIsPublic(newVisibility)

    const formData = new FormData()
    formData.append("perfumeId", item.perfume.id)
    formData.append("action", "updateVisibility")
    formData.append("isPublic", newVisibility.toString())

    const [error, response] = await safeAsync(() =>
      fetch("/api/wishlist", {
        method: "POST",
        headers: addToHeaders(),
        body: formData,
      })
    )

    if (error || !response.ok) {
      // Revert on error
      console.error("Error updating wishlist visibility:", error)
      setIsPublic(!newVisibility)
    }
  }

  return (
    <div className={styleMerge(wishlistVariants({ isAvailable }))}>
      <Form method="post" className="absolute top-2 right-2 z-10">
        <input type="hidden" name="intent" value="remove" />
        <input type="hidden" name="perfumeId" value={item.perfume.id} />
        <button
          type="submit"
          className="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-colors duration-200 group"
          title="Remove from wishlist"
        >
          <IoMdCloseCircle />
        </button>
      </Form>

      {isAvailable && (
        <div className="bg-noir-light text-noir-dark text-xs font-bold px-3 py-1 text-center animate-pulse">
          {t("wishlist.itemCard.available")}
        </div>
      )}
      <img
        src={item.perfume.image || "/placeholder-perfume.jpg"}
        alt={item.perfume.name}
        className="w-full h-48 object-cover"
      />
      <div>
        <h3 className="text-lg font-semibold mb-2 bg-noir-dark p-2">
          {item.perfume.name}
        </h3>
        <div className="px-4 pb-2">
          <p className={styleMerge(wishlistHouseVariants({ isAvailable }))}>
            by {item.perfume.perfumeHouse?.name || "Unknown House"}
          </p>

          {isAvailable && (
            <WishListAvailabilityInfo
              userPerfumes={item.perfume.userPerfume}
              availableAmount={availableAmount}
              perfumeName={item.perfume.name}
            />
          )}

          <div className="flex items-center justify-between mt-4">
            <span className={styleMerge(wishlistAddedVariants({ isAvailable }))}>
              Added on {new Date(item.createdAt).toLocaleDateString()}
            </span>
            <div className="flex items-center gap-2">
              <NavLink
                to={`/perfume/${item.perfume.slug}`}
                className="text-noir-blue/90 hover:text-noir-blue text-sm font-medium"
              >
                View Details
              </NavLink>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-noir-gold-200">
            <div className="flex items-center justify-between pb-4">
              <span
                className={styleMerge(wishlistVisibilityVariants({ isAvailable }))}
              >
                {t("wishlist.itemCard.visibility")}:
              </span>
              <VooDooCheck
                checked={isPublic}
                onChange={handleVisibilityToggle}
                labelChecked={t("wishlist.itemCard.public")}
                labelUnchecked={t("wishlist.itemCard.private")}
              />
            </div>
            <p className={styleMerge(wishlistVisibilityVariants({ isAvailable }))}>
              {isPublic
                ? t("wishlist.itemCard.availableMessage")
                : t("wishlist.itemCard.unavailableMessage")}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WishlistItemCard
