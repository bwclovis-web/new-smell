/* eslint-disable complexity */
import { type VariantProps } from "class-variance-authority"
import {
  type FC,
  type HTMLAttributes
} from "react"

import { useRangeSlider } from "~/hooks/useRangeSlider"
import { styleMerge } from "~/utils/styleUtils"

import { rangesliderVariants } from "./rangeslider-variants"

interface RangeSliderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'>,
  VariantProps<typeof rangesliderVariants> {
  min?: number
  max?: number
  step?: number
  value?: number
  onChange?: (value: number) => void
  disabled?: boolean
  label?: string
  formatValue?: (value: number) => string
}

const RangeSlider: FC<RangeSliderProps> = ({
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
  ...restProps
}) => {
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
      {label && (
        <div className="flex justify-between items-center text-md">
          <span>{label}</span>
          <span className="font-medium">
            {formatValue ? formatValue(internalValue) : internalValue + 'ml'}
          </span>
        </div>
      )}

      <div
        className={styleMerge(rangesliderVariants({ size, className }))}
        data-cy="RangeSlider"
        {...restProps}
      >
        <div
          ref={trackRef}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={internalValue}
          aria-disabled={disabled}
          className={`
            absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 
            bg-noir-gold-100 rounded-full cursor-pointer transition-colors
            focus:outline-none focus:ring-2 focus:ring-noir-gold focus:ring-offset-2
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'}
          `}
          onClick={handleTrackClick}
          onTouchStart={handleTrackTouch}
          onKeyDown={handleKeyDown}
        >
          <div
            ref={fillRef}
            className="absolute top-0 left-0 h-full bg-noir-gold-500 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div
          ref={thumbRef}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={`Slider thumb, current value: ${internalValue}`}
          className={`
            absolute top-1/2 w-8 h-8 -translate-y-1/2 -translate-x-1/2
            flex items-center justify-center
            cursor-pointer transition-colors z-10
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onKeyDown={handleKeyDown}
          style={{ left: `${percentage}%` }}
        >
          <div className={`
            w-5 h-5 bg-white border-2 border-noir-gold rounded-full shadow-md
            ${disabled ? 'border-gray-400' : 'hover:border-noir-gold-100'}
            ${isDragging ? 'border-noir-gold' : ''}
          `}></div>
        </div>

        <div
          className={`
            absolute top-1/2 w-6 h-6 -translate-y-1/2 -translate-x-1/2
            border-2 border-transparent rounded-full transition-all pointer-events-none
            ${isDragging ? 'border-blue-400 scale-150' : ''}
          `}
          style={{ left: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-noir-gold-500">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

export default RangeSlider  
