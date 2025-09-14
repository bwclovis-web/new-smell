import { type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type RefObject, type TouchEvent as ReactTouchEvent } from 'react'

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
  onTrackClick: (event: ReactMouseEvent) => void
  onTrackTouch: (event: ReactTouchEvent) => void
  onKeyDown: (event: ReactKeyboardEvent) => void
}

const SliderTrack = ({
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
}: SliderTrackProps) => (
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
