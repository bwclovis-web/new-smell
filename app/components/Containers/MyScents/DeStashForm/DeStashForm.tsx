import { type FormEvent, useState } from "react"

import { Button } from "~/components/Atoms/Button/Button"
import RangeSlider from "~/components/Atoms/RangeSlider/RangeSlider"
import type { UserPerfumeI } from "~/types"

interface DeStashFormProps {
  handleDecantConfirm: (amount: string) => void
  handleDecantCancel?: () => void
  userPerfume: UserPerfumeI
}

const DeStashForm = ({
  handleDecantConfirm,
  userPerfume
}: DeStashFormProps) => {
  const [deStashAmount, setDeStashAmount] = useState<string>("0")

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const amount = parseFloat(deStashAmount)
    if (amount >= 0 && amount <= parseFloat(userPerfume.amount)) {
      handleDecantConfirm(deStashAmount)
      setDeStashAmount("0")
    }
  }

  return (
    <div className='mt-4 bg-noir-light text-noir-dark p-4 shadow-lg border border-noir-dark/90 dark:border-noir-light/90 rounded-md'>
      <h3 className='text-lg font-semibold mb-2'>Decant Options</h3>
      <p className='text-sm text-gray-600'>Decanting allows you to share or transfer a portion of your fragrance to another bottle.</p>
      <p className='text-sm text-gray-600'>Enter the amount you want to make available for decanting.</p>
      <form onSubmit={handleSubmit} className="mt-4">
        <RangeSlider
          min={0}
          max={parseFloat(userPerfume.amount)}
          step={0.1}
          value={parseFloat(deStashAmount) || 0}
          onChange={
            value => {
              setDeStashAmount(value.toFixed(1))
            }
          }
          formatValue={value => value.toFixed(1)}
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={parseFloat(deStashAmount) < 0} variant="primary">
            {parseFloat(deStashAmount) === 0 ? "Remove from Trading Post" : "Confirm De-Stash"}
          </Button>
        </div>
      </form>
    </div>
  )
}
export default DeStashForm
