import React, { useEffect, useState } from 'react'

// import NoirIcon from '~/components/Atoms/NoirRating/NoirIcon'
import { RATING_LABELS } from '~/types'

interface SimpleNoirRatingProps {
  category: 'longevity' | 'sillage' | 'gender' | 'priceValue' | 'overall'
  value?: number | null
  onChange?: (rating: number) => void
  readonly?: boolean
  showLabel?: boolean
}

const SimpleNoirRating = ({
  category,
  value,
  onChange,
  readonly = false,
  showLabel = true
}: SimpleNoirRatingProps) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const [displayValue, setDisplayValue] = useState(value || 0)
  const labels = RATING_LABELS[category]
  const isInteractive = !readonly && Boolean(onChange)

  useEffect(() => {
    setDisplayValue(value || 0)
  }, [value])

  const currentValue = hoverValue || displayValue

  const handleChange = (rating: number) => {
    setDisplayValue(rating)
    onChange?.(rating)
  }

  const handleHover = (rating: number) => {
    if (isInteractive) {
      setHoverValue(rating)
    }
  }

  const handleLeave = () => {
    setHoverValue(null)
  }

  return (
    <div className="flex flex-col items-center gap-2 min-w-0 min-h-0">
      <div className="flex items-center gap-0.5 min-h-0 flex-shrink-0">
        {[
          1, 2, 3, 4, 5
        ].map(rating => (
          <button
            key={rating}
            type="button"
            aria-label={`Set rating to ${rating}`}
            disabled={readonly}
            onClick={event => {
              event.preventDefault()
              event.stopPropagation()
              if (onChange) {
                handleChange(rating)
              }
            }}
            onMouseEnter={() => onChange && handleHover(rating)}
            onMouseLeave={() => onChange && handleLeave()}
            className={`
              w-16 h-20 
              transition-opacity duration-300 
              cursor-pointer
              ${onChange ? 'hover:opacity-80' : 'cursor-default'}
              flex-shrink-0
              ${rating <= currentValue ? 'text-yellow-500' : 'text-gray-500'}
            `}
          >
            <div className="w-full h-full text-4xl flex items-center justify-center">
              {rating <= currentValue ? '⭐' : '☆'}
            </div>
          </button>
        ))}
      </div>
      {showLabel && (
        <span className="text-xs text-noir-gold font-medium text-center">
          {labels[currentValue] ?? 'select ranking'}
        </span>
      )}
    </div>
  )
}

export default SimpleNoirRating
