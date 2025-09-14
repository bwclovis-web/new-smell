import { useCallback, useState } from 'react'

export interface UseToggleOptions {
  initialValue?: boolean
  onToggle?: (value: boolean) => void
}

export interface UseToggleReturn {
  value: boolean
  toggle: () => void
  setTrue: () => void
  setFalse: () => void
  setValue: (value: boolean) => void
}

/**
 * Custom hook for managing boolean toggle state
 * 
 * @param options - Configuration options for the toggle
 * @returns Toggle state and handlers
 */
export const useToggle = ({
  initialValue = false,
  onToggle
}: UseToggleOptions = {}): UseToggleReturn => {
  const [value, setValueState] = useState(initialValue)

  const toggle = useCallback(() => {
    setValueState(prev => {
      const newValue = !prev
      onToggle?.(newValue)
      return newValue
    })
  }, [onToggle])

  const setTrue = useCallback(() => {
    setValueState(true)
    onToggle?.(true)
  }, [onToggle])

  const setFalse = useCallback(() => {
    setValueState(false)
    onToggle?.(false)
  }, [onToggle])

  const setValue = useCallback((newValue: boolean) => {
    setValueState(newValue)
    onToggle?.(newValue)
  }, [onToggle])

  return {
    value,
    toggle,
    setTrue,
    setFalse,
    setValue
  }
}

export default useToggle
