import React from "react"

import { Button } from "~/components/Atoms/Button"
import CheckBox from "~/components/Atoms/CheckBox"
import RadioSelect from "~/components/Atoms/RadioSelect"
import RangeSlider from "~/components/Atoms/RangeSlider"
import { useFormState } from "~/hooks"
import type { UserPerfumeI } from "~/types"

interface DeStashFormProps {
  // eslint-disable-next-line no-unused-vars
  handleDecantConfirm: (deStashData: DeStashData) => void
  handleDecantCancel?: () => void
  userPerfume: UserPerfumeI
}

interface DeStashData {
  amount: string
  price?: string
  tradePreference: 'cash' | 'trade' | 'both'
  tradeOnly: boolean
}

const DeStashForm = ({
  handleDecantConfirm,
  userPerfume
}: DeStashFormProps) => {
  const {
    values,
    errors,
    isValid,
    setValue,
    handleSubmit,
    reset
  } = useFormState({
    initialValues: {
      deStashAmount: "0",
      price: "",
      tradePreference: 'cash' as 'cash' | 'trade' | 'both',
      tradeOnly: false
    },
    validate: values => {
      const errors: Partial<Record<keyof typeof values, string>> = {}

      const amount = parseFloat(values.deStashAmount)
      if (amount < 0) {
        errors.deStashAmount = "Amount must be positive"
      }
      if (amount > parseFloat(userPerfume.amount)) {
        errors.deStashAmount = "Amount cannot exceed available amount"
      }

      return errors
    },
    onSubmit: values => {
      const deStashData: DeStashData = {
        amount: values.deStashAmount,
        price: values.price || undefined,
        tradePreference: values.tradePreference,
        tradeOnly: values.tradeOnly
      }
      handleDecantConfirm(deStashData)
      reset()
    }
  })

  const tradeOptions = [
    { id: 'cash', value: 'cash', label: 'Cash Only', name: 'tradePreference' },
    { id: 'trade', value: 'trade', label: 'Trade Only', name: 'tradePreference' },
    { id: 'both', value: 'both', label: 'Cash or Trade', name: 'tradePreference' }
  ]

  // Form submission is now handled by useFormState

  return (
    <div className='p-4'>
      <h3 className='text-lg font-semibold mb-2'>Decant Options</h3>
      <p className='text-sm text-gray-600'>Decanting allows you to share or transfer a portion of your fragrance to another bottle.</p>
      <p className='text-sm text-gray-600'>Set your amount, price, and trade preferences below.</p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Amount Slider */}
        <div>
          <RangeSlider
            min={0}
            max={parseFloat(userPerfume.amount)}
            step={0.1}
            value={parseFloat(values.deStashAmount) || 0}
            onChange={value => setValue('deStashAmount', value.toFixed(1))}
            formatValue={value => value.toFixed(1)}
            label="Amount to De-stash"
            showManualInput={true}
            inputPlaceholder={`Enter amount (0-${userPerfume.amount}ml)`}
          />
          {errors.deStashAmount && (
            <p className="text-red-500 text-sm mt-1">{errors.deStashAmount}</p>
          )}
        </div>

        {/* Price Input */}
        {parseFloat(values.deStashAmount) > 0 && (
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price ($ per ml, optional)
            </label>
            <input
              type="number"
              id="price"
              name="price"
              placeholder="0.00"
              value={values.price}
              onChange={event => setValue('price', event.target.value)}
              step="0.01"
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        )}

        {/* Trade Preferences */}
        {parseFloat(values.deStashAmount) > 0 && (
          <div>
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-2">
                Trade Preferences
              </legend>
              <RadioSelect
                data={tradeOptions.map(option => ({
                  ...option,
                  defaultChecked: option.value === values.tradePreference
                }))}
                handleRadioChange={event => setValue('tradePreference', event.target.value as 'cash' | 'trade' | 'both')}
              />
            </fieldset>
          </div>
        )}

        {/* Trade Only Checkbox */}
        {parseFloat(values.deStashAmount) > 0 && values.tradePreference !== 'cash' && (
          <div>
            <CheckBox
              label="Only accept trades (no cash offers)"
              checked={values.tradeOnly}
              onChange={() => setValue('tradeOnly', !values.tradeOnly)}
            />
          </div>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={!isValid || parseFloat(values.deStashAmount) < 0} variant="primary">
            {parseFloat(values.deStashAmount) === 0 ? "Remove from Trading Post" : "Confirm De-Stash"}
          </Button>
        </div>
      </form>
    </div>
  )
}
export default DeStashForm
