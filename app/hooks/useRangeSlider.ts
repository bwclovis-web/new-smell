/* eslint-disable max-statements */
import { useGSAP } from '@gsap/react'
import React, {
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'

import {
  calculatePercentage,
  calculateValueFromPosition,
  getKeyboardValue,
  setupHoverListeners,
  sliderAnimations
} from '~/utils/rangeSliderUtils'

import { useDragState } from './useDragState'

interface UseRangeSliderOptions {
  min?: number
  max?: number
  step?: number
  value?: number
  onChange?: (value: number) => void
  disabled?: boolean
}

interface UseRangeSliderReturn {
  // Refs
  trackRef: React.RefObject<HTMLDivElement | null>
  fillRef: React.RefObject<HTMLDivElement | null>
  thumbRef: React.RefObject<HTMLDivElement | null>

  // State
  isDragging: boolean
  internalValue: number
  percentage: number

  // Event handlers
  handleMouseDown: (event: ReactMouseEvent) => void
  handleTrackClick: (event: ReactMouseEvent) => void
  handleKeyDown: (event: ReactKeyboardEvent) => void
}

export const useRangeSlider = ({
  min = 0,
  max = 100,
  step = 1,
  value = 0,
  onChange,
  disabled = false
}: UseRangeSliderOptions): UseRangeSliderReturn => {
  const trackRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [internalValue, setInternalValue] = useState(value)

  const percentage = calculatePercentage(internalValue, min, max)

  const updateValue = useCallback((newValue: number) => {
    setInternalValue(newValue)
    onChange?.(newValue)
  }, [onChange])

  const calculateValue = useCallback((clientX: number) => {
    if (!trackRef.current) {
      return internalValue
    }
    return calculateValueFromPosition({
      clientX,
      trackElement: trackRef.current,
      min,
      max,
      step
    })
  }, [
    min, max, step, internalValue
  ])

  // Animation effects
  useGSAP(() => {
    if (thumbRef.current && fillRef.current) {
      sliderAnimations.animatePosition(
        thumbRef.current,
        fillRef.current,
        percentage,
        isDragging
      )
    }
  }, [percentage, isDragging])

  // Hover animations
  useGSAP(() => {
    if (!thumbRef.current) {
      return
    }
    return setupHoverListeners(thumbRef.current, disabled, isDragging)
  }, [disabled, isDragging])

  // Drag state management
  const { startDragging } = useDragState({
    onValueChange: updateValue,
    calculateValue,
    thumbRef
  })

  // Event handlers
  const handleMouseDown = useCallback((event: ReactMouseEvent) => {
    if (disabled) {
      return
    }
    event.preventDefault()
    setIsDragging(true)
    startDragging(event.clientX)
  }, [disabled, startDragging])

  const handleTrackClick = useCallback((event: ReactMouseEvent) => {
    if (disabled || event.target === thumbRef.current) {
      return
    }
    const newValue = calculateValue(event.clientX)
    updateValue(newValue)
  }, [disabled, calculateValue, updateValue])

  const handleKeyDown = useCallback((event: ReactKeyboardEvent) => {
    if (disabled) {
      return
    }

    const newValue = getKeyboardValue({
      key: event.key,
      currentValue: internalValue,
      min,
      max,
      step
    })
    if (newValue !== null) {
      event.preventDefault()
      updateValue(newValue)
    }
  }, [
    disabled, internalValue, min, max, step, updateValue
  ])

  // Sync external value changes
  useEffect(() => {
    setInternalValue(value)
  }, [value])

  return {
    trackRef,
    fillRef,
    thumbRef,
    isDragging,
    internalValue,
    percentage,
    handleMouseDown,
    handleTrackClick,
    handleKeyDown
  }
}
