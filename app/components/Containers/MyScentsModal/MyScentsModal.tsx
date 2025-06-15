import { getFormProps, useForm } from "@conform-to/react"
import { getZodConstraint, parseWithZod } from "@conform-to/zod"
import { useRef, useState } from "react"
import { Form, useSubmit } from "react-router"

import Input from "~/components/Atoms/Input/Input"
import SearchBar from "~/components/Organisms/SearchBar/SearchBar"
import { UpdateUserPerfumeSchema } from "~/utils/formValidationSchemas"

const MyScentsModal = () => {
  const [selectedPerfume, setSelectedPerfume] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const submit = useSubmit()
  const handleClick = (item: any) => {
    setSelectedPerfume(item)
  }
  const [form, { amount }] = useForm({
    constraint: getZodConstraint(UpdateUserPerfumeSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: UpdateUserPerfumeSchema })
    }
  })

  const handleAddPerfume = () => {
    if (!selectedPerfume) {
      return
    }

    const formData = new FormData()
    formData.append('perfumeId', selectedPerfume.id)
    formData.append('action', 'add')

    submit(formData, { method: 'post' })
    setSelectedPerfume('')
  }
  return (
    <div>
      <h2>My Scents</h2>
      <p>This is where you can manage your favorite scents.</p>
      <SearchBar searchType="perfume" className="mt-4" action={handleClick} />
      {selectedPerfume && (
        <Form method="POST" {...getFormProps(form)} className="mt-4">
          <h3>Selected Perfume:</h3>
          <p>{selectedPerfume.name}</p>
          <Input
            inputType={""}
            inputRef={inputRef}
            action={amount}
            inputId="amount"
            defaultValue={selectedPerfume.amount || ""}
          />
          <button > HELLO</button>
        </Form>
      )}
    </div>
  )
}

export default MyScentsModal
