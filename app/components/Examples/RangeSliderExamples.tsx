import { useRangeSlider } from "~/hooks/useRangeSlider"

// Example of how to create a simple price filter component using the reusable hook
export const PriceFilter = () => {
  const {
    trackRef,
    fillRef,
    thumbRef,
    isDragging,
    internalValue,
    percentage,
    handleMouseDown,
    handleTrackClick,
    handleKeyDown
  } = useRangeSlider({
    min: 0,
    max: 1000,
    step: 10,
    value: 250,
    onChange: value => console.log('Price changed to:', value),
    disabled: false
  })

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center text-sm text-gray-700">
        <span>Price Range</span>
        <span className="font-medium">${internalValue}</span>
      </div>

      <div className="relative h-6">
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-valuemin={0}
          aria-valuemax={1000}
          aria-valuenow={internalValue}
          className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 bg-gray-200 rounded-full cursor-pointer"
          onClick={handleTrackClick}
          onKeyDown={handleKeyDown}
        >
          <div
            ref={fillRef}
            className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div
          ref={thumbRef}
          className="absolute top-1/2 w-5 h-5 -translate-y-1/2 -translate-x-1/2 bg-white border-2 border-green-500 rounded-full shadow-md cursor-pointer z-10"
          onMouseDown={handleMouseDown}
          onKeyDown={handleKeyDown}
          style={{ left: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>$0</span>
        <span>$1000</span>
      </div>
    </div>
  )
}

// Example of a volume control using the same hook
export const VolumeControl = () => {
  const {
    trackRef,
    fillRef,
    thumbRef,
    isDragging,
    internalValue,
    percentage,
    handleMouseDown,
    handleTrackClick,
    handleKeyDown
  } = useRangeSlider({
    min: 0,
    max: 100,
    step: 1,
    value: 50,
    onChange: value => console.log('Volume changed to:', value),
    disabled: false
  })

  return (
    <div className="flex items-center space-x-3">
      <span className="text-sm">🔊</span>

      <div className="relative h-6 flex-1">
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={internalValue}
          className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 bg-gray-300 rounded-full cursor-pointer"
          onClick={handleTrackClick}
          onKeyDown={handleKeyDown}
        >
          <div
            ref={fillRef}
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div
          ref={thumbRef}
          className="absolute top-1/2 w-3 h-3 -translate-y-1/2 -translate-x-1/2 bg-blue-500 rounded-full cursor-pointer z-10"
          onMouseDown={handleMouseDown}
          onKeyDown={handleKeyDown}
          style={{ left: `${percentage}%` }}
        />
      </div>

      <span className="text-sm w-8">{internalValue}%</span>
    </div>
  )
}
