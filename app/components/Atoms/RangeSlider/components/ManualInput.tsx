import { type FC, useState, useCallback, useEffect } from 'react'

interface ManualInputProps {
  value: number
  min: number
  max: number
  step: number
  disabled: boolean
  formatValue?: (value: number) => string
  inputPlaceholder?: string
  onChange: (value: number) => void
}

const ManualInput: FC<ManualInputProps> = ({
  value,
  min,
  max,
  step,
  disabled,
  formatValue,
  inputPlaceholder,
  onChange
}) => {
  const [inputValue, setInputValue] = useState(formatValue ? formatValue(value) : value.toString())
  const [isInputFocused, setIsInputFocused] = useState(false)

  // Update input value when slider value changes (but not when user is typing)
  const updateInputValue = useCallback(() => {
    if (!isInputFocused) {
      setInputValue(formatValue ? formatValue(value) : value.toString())
    }
  }, [value, formatValue, isInputFocused])

  // Update input value when internal value changes
  useEffect(() => {
    updateInputValue()
  }, [updateInputValue])

  // Handle manual input changes
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    setInputValue(newValue)
  }, [])

  // Handle manual input blur/enter - validate and update slider
  const handleInputBlur = useCallback(() => {
    setIsInputFocused(false)
    const numericValue = parseFloat(inputValue)

    if (!isNaN(numericValue)) {
      // Clamp value to min/max bounds
      const clampedValue = Math.min(Math.max(numericValue, min), max)
      // Round to step precision
      const steppedValue = Math.round(clampedValue / step) * step

      if (steppedValue !== value) {
        onChange(steppedValue)
      }
      setInputValue(formatValue ? formatValue(steppedValue) : steppedValue.toString())
    } else {
      // Reset to current value if invalid
      setInputValue(formatValue ? formatValue(value) : value.toString())
    }
  }, [inputValue, min, max, step, value, onChange, formatValue])

  // Handle manual input focus
  const handleInputFocus = useCallback(() => {
    setIsInputFocused(true)
  }, [])

  // Handle Enter key in input
  const handleInputKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur()
    }
  }, [])

  return (
    <div className="mt-3">
      <input
        type="number"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={handleInputFocus}
        onKeyDown={handleInputKeyDown}
        placeholder={inputPlaceholder || `Enter value (${min}-${max})`}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={`
          w-full px-3 py-2 text-sm border rounded-md
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-900'}
          border-gray-300
        `}
      />
    </div>
  )
}

export default ManualInput
