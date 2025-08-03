import { useTranslation } from "react-i18next"

const RatingLabel = ({
  showLabel,
  currentValue,
  labels
}: {
  showLabel: boolean
  currentValue: number
  labels: { [key: number]: string }
}) => {
  const { t } = useTranslation()
  if (!showLabel) {
    return null
  }

  return (
    <span className="text-xs text-noir-gold-500 font-medium">
      {labels[currentValue] ?? t('singlePerfume.rating.selectRating')}
    </span>
  )
}

export default RatingLabel
