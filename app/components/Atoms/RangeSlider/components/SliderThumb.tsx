import { type FC, type RefObject } from 'react'

interface SliderThumbProps {
  thumbRef: RefObject<HTMLDivElement | null>
  percentage: number
  value: number
  disabled: boolean
  isDragging: boolean
  onMouseDown: (event: React.MouseEvent) => void
  onTouchStart: (event: React.TouchEvent) => void
  onKeyDown: (event: React.KeyboardEvent) => void
}

const SliderThumb: FC<SliderThumbProps> = ({
  thumbRef,
  percentage,
  value,
  disabled,
  isDragging,
  onMouseDown,
  onTouchStart,
  onKeyDown
}) => (
  <>
    <div
      ref={thumbRef}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`Slider thumb, current value: ${value}`}
      className={`
        absolute top-1/2 w-8 h-8 -translate-y-1/2 -translate-x-1/2
        flex items-center justify-center
        cursor-pointer transition-colors z-10
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onKeyDown={onKeyDown}
      style={{ left: `${percentage}%` }}
    >
      <div className={`
        w-5 h-5 bg-white border-2 border-noir-gold rounded-full shadow-md
        ${disabled ? 'border-gray-400' : 'hover:border-noir-gold-100'}
        ${isDragging ? 'border-noir-gold' : ''}
      `}></div>
    </div>

    {/* Drag indicator ring */}
    <div
      className={`
        absolute top-1/2 w-6 h-6 -translate-y-1/2 -translate-x-1/2
        border-2 border-transparent rounded-full transition-all pointer-events-none
        ${isDragging ? 'border-blue-400 scale-150' : ''}
      `}
      style={{ left: `${percentage}%` }}
    />
  </>
)

export default SliderThumb
