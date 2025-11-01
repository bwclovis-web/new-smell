import { useTranslation } from "react-i18next"
import { BsHeartFill } from "react-icons/bs"

interface WishlistItem {
  id: string
  perfumeId: string
  isPublic: boolean
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    username: string
    email: string
  }
  perfume: {
    id: string
    name: string
    image?: string
    perfumeHouse?: {
      id: string
      name: string
    }
  }
}

interface ItemsSearchingForProps {
  wishlistItems: WishlistItem[]
}

const ItemsSearchingFor = ({ wishlistItems }: ItemsSearchingForProps) => {
  const { t } = useTranslation()

  if (wishlistItems.length === 0) {
    return (
      <div className="mt-6">
        <p className="text-noir-gold-100 italic">
          {t("traderProfile.noItemsSearchingFor")}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6">
      <ul className="space-y-4">
        {wishlistItems.map((item) => (
          <li
            key={item.id}
            className="border bg-noir-gold/10 border-noir-gold rounded p-3 flex items-center gap-3"
          >
            <div className="flex-shrink-0">
              <BsHeartFill className="text-red-500" size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {item.perfume.image && (
                  <img
                    src={item.perfume.image}
                    alt={item.perfume.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div>
                  <h3 className="font-medium text-noir-gold">{item.perfume.name}</h3>
                  {item.perfume.perfumeHouse && (
                    <p className="text-sm text-noir-gold-100">
                      by {item.perfume.perfumeHouse.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <span className="text-xs text-noir-gold-500">
                Added {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ItemsSearchingFor
