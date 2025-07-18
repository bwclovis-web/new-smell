const RatingLabel = ({
  showLabel,
  currentValue,
  labels
}: {
  showLabel: boolean
  currentValue: number
  labels: { [key: number]: string }
}) => {
  if (!showLabel) {
    return null
  }

  return (
    <span className="text-xs text-noir-gold-500 font-medium">
      {labels[currentValue] ?? 'select ranking'}
    </span>
  )
}

export default RatingLabel
