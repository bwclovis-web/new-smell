import { useState } from "react"
import { IoMdCloseCircle } from "react-icons/io"
import { Form, NavLink } from "react-router"

import VooDooCheck from "~/components/Atoms/VooDooCheck/VooDooCheck"
import { useCSRF } from "~/hooks/useCSRF"

import WishListAvailabilityInfo from "./WishlistAvbalibilityInfo"

interface WishlistItemCardProps {
  item: any
  isAvailable: boolean
  availableAmount: number
}

const WishlistItemCard = ({
  item,
  isAvailable,
  availableAmount
}: WishlistItemCardProps) => {
  const [isPublic, setIsPublic] = useState(item.isPublic)
  const { addToHeaders } = useCSRF()

  const handleVisibilityToggle = async () => {
    const newVisibility = !isPublic
    setIsPublic(newVisibility)

    try {
      const formData = new FormData()
      formData.append('perfumeId', item.perfume.id)
      formData.append('action', 'updateVisibility')
      formData.append('isPublic', newVisibility.toString())

      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: addToHeaders(),
        body: formData
      })

      if (!response.ok) {
        // Revert on error
        setIsPublic(!newVisibility)
      }
    } catch {
      // Revert on error
      setIsPublic(!newVisibility)
    }
  }

  return (
    <div
      className={`rounded-lg shadow-md overflow-hidden border transition-all duration-300 my-10 relative ${isAvailable
        ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-600 ring-2 ring-green-200 dark:ring-green-700 shadow-green-100 dark:shadow-green-900/20'
        : 'bg-noir-dark'
        }`}
    >
      {/* Remove button */}
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
          🎉 AVAILABLE IN TRADING POST! 🎉
        </div>
      )}
      <img
        src={item.perfume.image || '/placeholder-perfume.jpg'}
        alt={item.perfume.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">
          {item.perfume.name}
        </h3>
        <p className="text-sm text-noir-gold mb-2">
          by
          {' '}
          {item.perfume.perfumeHouse?.name || 'Unknown House'}
        </p>
        {item.perfume.description && (
          <p className="text-sm text-noir-gold-100 mb-4">
            {item.perfume.description}
          </p>
        )}

        {isAvailable && (
          <WishListAvailabilityInfo
            userPerfumes={item.perfume.userPerfume}
            availableAmount={availableAmount}
            perfumeName={item.perfume.name}
          />
        )}

        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-noir-gold-500">
            Added
            {' '}
            {new Date(item.createdAt).toLocaleDateString()}
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

        {/* Public/Private Toggle */}
        <div className="mt-3 pt-3 border-t border-noir-gold-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-noir-gold-100">
              Visibility:
            </span>
            <VooDooCheck
              checked={isPublic}
              onChange={handleVisibilityToggle}
              labelChecked="Public"
              labelUnchecked="Private"
            />
          </div>
          <p className="text-xs text-noir-gold-200 mt-1">
            {isPublic
              ? 'This item will appear on your trader profile'
              : 'This item is private and will not appear on your trader profile'
            }
          </p>
        </div>
      </div>
    </div>
  )
}

export default WishlistItemCard
