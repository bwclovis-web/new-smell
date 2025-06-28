import React, { useRef, useState } from "react"

import { Button } from "~/components/Atoms/Button/Button"
import Input from "~/components/Atoms/Input/Input"

interface DecantFormProps {
  handleDecantConfirm: (amount: string) => void
  handleDecantCancel?: () => void
}

const DecantForm = ({
  handleDecantConfirm,
  handleDecantCancel
}: DecantFormProps) => {
  const [decantAmount, setDecantAmount] = useState<string>("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (decantAmount.trim()) {
      handleDecantConfirm(decantAmount)
      setDecantAmount("")
    }
  }

  const handleInputChange = (event: React.FormEvent<HTMLInputElement>) => {
    setDecantAmount((event.target as HTMLInputElement).value)
  }

  return (
    <div className='mt-4'>
      <h3 className='text-lg font-semibold mb-2'>Decant Options</h3>
      <p className='text-sm text-gray-600'>Decanting allows you to share or transfer a portion of your fragrance to another bottle.</p>
      <p className='text-sm text-gray-600'>Enter the amount you want to make available for decanting.</p>

      <form onSubmit={handleSubmit} className="mt-4">
        <Input
          inputType="text"
          inputRef={inputRef}
          inputId="decantAmount"
          label="Amount to make available"
          placeholder="e.g., 5ml, 10ml, 1oz"
          value={decantAmount}
          onChange={handleInputChange}
          className="mb-4"
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={!decantAmount.trim()}>
            Confirm Decant
          </Button>
          {handleDecantCancel && (
            <Button
              type="button"
              onClick={handleDecantCancel}
              style="secondary"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
export default DecantForm
