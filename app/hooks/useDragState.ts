import React, { useCallback, useRef } from 'react'

import { sliderAnimations } from '~/utils/rangeSliderUtils'

interface UseDragStateOptions {
  onValueChange: (value: number) => void
  calculateValue: (clientX: number) => number
  thumbRef: React.RefObject<HTMLDivElement | null>
}

export const useDragState = ({
  onValueChange,
  calculateValue,
  thumbRef
}: UseDragStateOptions) => {
  const isDraggingRef = useRef(false)

  const handleMouseMove = useCallback((event: Event) => {
    const mouseEvent = event as globalThis.MouseEvent
    const newValue = calculateValue(mouseEvent.clientX)
    onValueChange(newValue)
  }, [calculateValue, onValueChange])

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false
    if (thumbRef.current) {
      sliderAnimations.animateScale(thumbRef.current, 1.2)
    }
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove, thumbRef])

  const startDragging = useCallback((clientX: number) => {
    isDraggingRef.current = true

    const newValue = calculateValue(clientX)
    onValueChange(newValue)

    if (thumbRef.current) {
      sliderAnimations.animateScale(thumbRef.current, 1.3, 0.1)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [
    calculateValue, onValueChange, handleMouseMove, handleMouseUp, thumbRef
  ])

  return {
    isDragging: isDraggingRef.current,
    startDragging
  }
}
