import { useTranslation } from "react-i18next"

import { getPerfumeTypeLabel } from "~/data/SelectTypes"
import { formatPrice } from "~/utils/numberUtils"

const GeneralDetails = ({ userPerfume }: { userPerfume: any }) => {
  const { t } = useTranslation()

  return (
    <div className="flex gap-10 mt-6 justify-between items-center px-2">
      {userPerfume.placeOfPurchase && (
        <p className="font-medium flex flex-col justify-start items-start">
          <span className="text-xl">{t("myScents.listItem.pointOfPurchase")}</span>
          <span className="text-2xl text-noir-gold-100 capitalize">
            {userPerfume.placeOfPurchase}
          </span>
        </p>
      )}
      <div className="flex items-start justify-start gap-8">
        {userPerfume.price && (
          <p className="flex flex-col items-end justify-start">
            <span className="text-lg font-medium">
              {t("myScents.listItem.price")}
            </span>
            <span className="text-xl text-noir-gold-100">
              {formatPrice(userPerfume.price)}
            </span>
          </p>
        )}
        <p className="flex flex-col items-end justify-start">
          <span className="text-lg font-medium">{t("myScents.listItem.type")}</span>
          <span className="text-xl text-noir-gold-100">
            {getPerfumeTypeLabel(userPerfume.type)}
          </span>
        </p>
      </div>
    </div>
  )
}

export default GeneralDetails
