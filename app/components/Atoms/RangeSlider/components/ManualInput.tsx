import { useCallback, useEffect, useState } from 'react'

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

const ManualInput = ({
  value,
  min,
  max,
  step,
  disabled,
  formatValue,
  inputPlaceholder,
  onChange
}: ManualInputProps) => {
  const [inputValue, setInputValue] = useState(formatValue ? formatValue(value) : value.toString())
  const [isInputFocused, setIsInputFocused] = useState(false)

  const updateInputValue = useCallback(() => {
    if (!isInputFocused) {
      setInputValue(formatValue ? formatValue(value) : value.toString())
    }
  }, [value, formatValue, isInputFocused])

  useEffect(() => {
    updateInputValue()
  }, [updateInputValue])

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    setInputValue(newValue)
  }, [])

  const handleInputBlur = useCallback(() => {
    setIsInputFocused(false)
    const numericValue = parseFloat(inputValue)

    if (!isNaN(numericValue)) {
      const clampedValue = Math.min(Math.max(numericValue, min), max)
      const steppedValue = Math.round(clampedValue / step) * step

      if (steppedValue !== value) {
        onChange(steppedValue)
      }
      setInputValue(formatValue ? formatValue(steppedValue) : steppedValue.toString())
    } else {
      setInputValue(formatValue ? formatValue(value) : value.toString())
    }
  }, [
    inputValue, min, max, step, value, onChange, formatValue
  ])

  const handleInputFocus =
    useCallback(() => {
      setIsInputFocused(true)
    }, [])

  const handleInputKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
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
  }, [])
}

export default ManualInput
