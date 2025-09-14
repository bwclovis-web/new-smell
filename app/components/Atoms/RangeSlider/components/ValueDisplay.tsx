import { type FC } from 'react'

import { styleMerge } from '~/utils/styleUtils'

import { rangeSliderMaxVariants } from '../rangeSlider-variants'

interface ValueDisplayProps {
  label?: string
  value: number
  formatValue?: (value: number) => string
  min: number
  max: number
  className?: string
}

const ValueDisplay: FC<ValueDisplayProps> = ({
  label,
  value,
  formatValue,
  min,
  max,
  className
}) => (
  <>
    {label && (
      <div className="flex justify-between items-center text-md">
        <span>{label}</span>
        <span className="font-medium">
          {formatValue ? formatValue(value) : value + 'ml'}
        </span>
      </div>
    )}

    <div className={styleMerge(rangeSliderMaxVariants({ className, theme: "light" }))}>
      <span>{min}</span>
      <span>{max}</span>
    </div>
  </>
)

export default ValueDisplay
