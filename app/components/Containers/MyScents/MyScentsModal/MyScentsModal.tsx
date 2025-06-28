import { useContext, useRef, useState } from "react"
import { Form, useSubmit } from "react-router"

import { Button } from "~/components/Atoms/Button/Button"
import Input from "~/components/Atoms/Input/Input"
import SearchBar from "~/components/Organisms/SearchBar/SearchBar"
import SessionContext from "~/providers/sessionProvider"

const MyScentsModal = () => {
  const { modalData } = useContext(SessionContext)
  const [selectedPerfume, setSelectedPerfume] = useState<any | null>(modalData === "create" ? null : modalData.perfume)
  const [perfumeAmount, setPerfumeAmount] = useState<string>("")

  const inputRef = useRef<HTMLInputElement | null>(null)
  const submit = useSubmit()

  const handleClick = (item: any) => {
    setSelectedPerfume(item)
    setPerfumeAmount(item.amount || "")
  }

  const handleAddPerfume = () => {
    if (!selectedPerfume) {
      return
    }
    const formData = new FormData()
    formData.append("perfumeId", selectedPerfume.id)
    formData.append("amount", perfumeAmount)
    formData.append("action", "add")
    submit(formData, { method: "post" })
    setSelectedPerfume(null)
    setPerfumeAmount("")
  }


  return (
    <div>
      <h2>My Scents</h2>
      <p>This is where you can manage your favorite scents.</p>
      {modalData === "create" && (
        <SearchBar searchType="perfume" className="mt-4" action={handleClick} />
      )}

      {selectedPerfume && (
        <Form
          method="POST"
          className="mt-4"
          onSubmit={event => {
            event.preventDefault()
            handleAddPerfume()
          }}
        >
          <h3>Selected Perfume:</h3>
          <p>{selectedPerfume.name}</p>
          <Input
            inputType="text"
            inputRef={inputRef}
            inputId="amount"
            label="Amount"
            value={perfumeAmount}
            onChange={event => (
              setPerfumeAmount((event.target as HTMLInputElement).value)
            )}
          />
          <Button type="submit" className="mt-6">Add to My Collection</Button>
        </Form>
      )}
    </div>
  )
}

export default MyScentsModal
