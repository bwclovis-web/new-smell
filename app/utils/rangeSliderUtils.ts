import { gsap } from 'gsap'

/**
 * Calculates the percentage position of a value within a range
 */
export const calculatePercentage = (
  value: number,
  min: number,
  max: number
): number => ((value - min) / (max - min)) * 100

/**
 * Calculates a value from a mouse position within a track element
 */
export const calculateValueFromPosition = ({
  clientX,
  trackElement,
  min,
  max,
  step
}: {
  clientX: number
  trackElement: HTMLElement
  min: number
  max: number
  step: number
}): number => {
  const rect = trackElement.getBoundingClientRect()
  const newPercentage = Math.max(
    0,
    Math.min(1, (clientX - rect.left) / rect.width)
  )
  const rawValue = min + newPercentage * (max - min)
  const steppedValue = Math.round(rawValue / step) * step
  return Math.max(min, Math.min(max, steppedValue))
}

/**
 * Handles keyboard navigation for slider
 */
export const getKeyboardValue = ({
  key,
  currentValue,
  min,
  max,
  step
}: {
  key: string
  currentValue: number
  min: number
  max: number
  step: number
}): number | null => {
  switch (key) {
    case 'ArrowLeft':
    case 'ArrowDown':
      return Math.max(min, currentValue - step)
    case 'ArrowRight':
    case 'ArrowUp':
      return Math.min(max, currentValue + step)
    case 'Home':
      return min
    case 'End':
      return max
    default:
      return null
  }
}

/**
 * Animation utilities for slider elements
 */
export const sliderAnimations = {
  animatePosition: (
    thumbElement: HTMLElement,
    fillElement: HTMLElement,
    percentage: number,
    isDragging: boolean
  ) => {
    const duration = isDragging ? 0 : 0.3
    const ease = "power2.out"

    gsap.to(thumbElement, {
      x: `${percentage}%`,
      duration,
      ease
    })

    gsap.to(fillElement, {
      width: `${percentage}%`,
      duration,
      ease
    })
  },

  animateScale: (element: HTMLElement, scale: number, duration = 0.2) => {
    gsap.to(element, {
      scale,
      duration,
      ease: "power2.out"
    })
  }
}

/**
 * Sets up hover animations for slider thumb
 */
export const setupHoverListeners = (
  thumbElement: HTMLElement,
  disabled: boolean,
  isDragging: boolean
): (() => void) => {
  const handleMouseEnter = () => {
    if (!disabled) {
      sliderAnimations.animateScale(thumbElement, 1.2)
    }
  }

  const handleMouseLeave = () => {
    if (!isDragging && !disabled) {
      sliderAnimations.animateScale(thumbElement, 1)
    }
  }

  thumbElement.addEventListener('mouseenter', handleMouseEnter)
  thumbElement.addEventListener('mouseleave', handleMouseLeave)

  return () => {
    thumbElement.removeEventListener('mouseenter', handleMouseEnter)
    thumbElement.removeEventListener('mouseleave', handleMouseLeave)
  }
}
