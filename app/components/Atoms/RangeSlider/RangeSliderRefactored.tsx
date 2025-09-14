import { type VariantProps } from "class-variance-authority"
import { type FC, type HTMLAttributes } from "react"

import { useRangeSlider } from "~/hooks/useRangeSlider"
import { styleMerge } from "~/utils/styleUtils"

import ManualInput from "./components/ManualInput"
import SliderThumb from "./components/SliderThumb"
import SliderTrack from "./components/SliderTrack"
import ValueDisplay from "./components/ValueDisplay"
import { rangeSliderWrapVariants } from "./rangeSlider-variants"

interface RangeSliderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'>,
  VariantProps<typeof rangeSliderWrapVariants> {
  min?: number
  max?: number
  step?: number
  value?: number
  onChange?: (value: number) => void
  disabled?: boolean
  label?: string
  formatValue?: (value: number) => string
  showManualInput?: boolean
  inputPlaceholder?: string
}

const RangeSlider = ({
  className,
  min = 0,
  max = 100,
  step = 1,
  value = 0,
  onChange,
  disabled = false,
  label,
  formatValue,
  size = "medium",
  showManualInput = false,
  inputPlaceholder,
  ...restProps
}: RangeSliderProps) => {
  const {
    trackRef,
    fillRef,
    thumbRef,
    isDragging,
    internalValue,
    percentage,
    handleMouseDown,
    handleTouchStart,
    handleTrackClick,
    handleTrackTouch,
    handleKeyDown
  } = useRangeSlider({
    min,
    max,
    step,
    value,
    onChange,
    disabled
  })

  return (
    <div className="w-full space-y-2 text-noir-gold">
      <ValueDisplay
        label={label}
        value={internalValue}
        formatValue={formatValue}
        min={min}
        max={max}
        className={className}
      />

      <div
        className={styleMerge(rangeSliderWrapVariants({ size, className }))}
        data-cy="RangeSlider"
        {...restProps}
      >
        <SliderTrack
          trackRef={trackRef}
          fillRef={fillRef}
          percentage={percentage}
          min={min}
          max={max}
          value={internalValue}
          disabled={disabled}
          className={className}
          onTrackClick={handleTrackClick}
          onTrackTouch={handleTrackTouch}
          onKeyDown={handleKeyDown}
        />

        <SliderThumb
          thumbRef={thumbRef}
          percentage={percentage}
          value={internalValue}
          disabled={disabled}
          isDragging={isDragging}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onKeyDown={handleKeyDown}
        />
      </div>

      {showManualInput && (
        <ManualInput
          value={internalValue}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          formatValue={formatValue}
          inputPlaceholder={inputPlaceholder}
          onChange={onChange || (() => { })}
        />
      )}
    </div>
  )
}

export default RangeSlider
