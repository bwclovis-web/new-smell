import { type FC, type RefObject } from 'react'

import { styleMerge } from '~/utils/styleUtils'

import { rangeSliderFillVariants, rangeSliderVariants } from '../rangeSlider-variants'

interface SliderTrackProps {
  trackRef: RefObject<HTMLDivElement | null>
  fillRef: RefObject<HTMLDivElement | null>
  percentage: number
  min: number
  max: number
  value: number
  disabled: boolean
  className?: string
  onTrackClick: (event: React.MouseEvent) => void
  onTrackTouch: (event: React.TouchEvent) => void
  onKeyDown: (event: React.KeyboardEvent) => void
}

const SliderTrack: FC<SliderTrackProps> = ({
  trackRef,
  fillRef,
  percentage,
  min,
  max,
  value,
  disabled,
  className,
  onTrackClick,
  onTrackTouch,
  onKeyDown
}) => (
  <div
    ref={trackRef}
    role="slider"
    tabIndex={disabled ? -1 : 0}
    aria-valuemin={min}
    aria-valuemax={max}
    aria-valuenow={value}
    aria-disabled={disabled}
    className={styleMerge(rangeSliderVariants({ className, theme: "light" }))}
    onClick={onTrackClick}
    onTouchStart={onTrackTouch}
    onKeyDown={onKeyDown}
  >
    <div
      ref={fillRef}
      className={styleMerge(rangeSliderFillVariants({ className, theme: "light" }))}
      style={{ width: `${percentage}%` }}
    />
  </div>
)

export default SliderTrack
