import { useTranslation } from "react-i18next"
import { MdDelete, MdEdit } from "react-icons/md"

import { Button } from "~/components/Atoms/Button"
import type { UserPerfumeI } from "~/types"

interface DestashItemProps {
  destash: UserPerfumeI
  onEdit: () => void
  onDelete: () => void
}

const DestashItem = ({ destash, onEdit, onDelete }: DestashItemProps) => {
  const { t } = useTranslation()

  const getTradePreferenceLabel = (preference: "cash" | "trade" | "both") => {
    switch (preference) {
      case "cash":
        return t("myScents.listItem.decantOptionsTradePreferencesCash")
      case "trade":
        return t("myScents.listItem.decantOptionsTradePreferencesTrade")
      case "both":
        return t("myScents.listItem.decantOptionsTradePreferencesBoth")
      default:
        return preference
    }
  }

  return (
    <div className="noir-border p-4 bg-noir-dark/20 flex justify-between items-start gap-4">
      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-noir-gold-500 font-medium">
            {t("myScents.destashManager.amount")}
          </p>
          <p className="text-lg text-noir-gold-100">
            {destash.available} ml
          </p>
        </div>
        {destash.tradePrice && (
          <div>
            <p className="text-sm text-noir-gold-500 font-medium">
              {t("myScents.destashManager.price")}
            </p>
            <p className="text-lg text-noir-gold-100">
              ${destash.tradePrice}
            </p>
          </div>
        )}
        <div>
          <p className="text-sm text-noir-gold-500 font-medium">
            {t("myScents.destashManager.tradePreference")}
          </p>
          <p className="text-lg text-noir-gold-100">
            {getTradePreferenceLabel(destash.tradePreference as "cash" | "trade" | "both")}
          </p>
        </div>
        {destash.tradeOnly && (
          <div>
            <p className="text-sm text-noir-gold-500 font-medium">
              {t("myScents.destashManager.tradeOnly")}
            </p>
            <p className="text-lg text-noir-gold-100">
              {t("myScents.destashManager.yes")}
            </p>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onEdit}
          variant="secondary"
          size="sm"
          leftIcon={<MdEdit size={16} />}
        >
          {t("myScents.destashManager.edit")}
        </Button>
        <Button
          onClick={onDelete}
          variant="danger"
          size="sm"
          leftIcon={<MdDelete size={16} />}
        >
          {t("myScents.destashManager.delete")}
        </Button>
      </div>
    </div>
  )
}

export default DestashItem
