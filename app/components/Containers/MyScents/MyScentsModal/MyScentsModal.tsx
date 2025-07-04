import { useContext, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Form, useSubmit } from "react-router"

import { Button } from "~/components/Atoms/Button/Button"
import Input from "~/components/Atoms/Input/Input"
import SearchBar from "~/components/Organisms/SearchBar/SearchBar"
import SessionContext from "~/providers/sessionProvider"
import type { UserPerfumeI } from "~/types"

interface MyScentsModalProps {
  perfume?: UserPerfumeI
}

const MyScentsModal = ({ perfume }: MyScentsModalProps) => {
  const { modalData } = useContext(SessionContext)
  const { t } = useTranslation()
  const [selectedPerfume, setSelectedPerfume] =
    useState<UserPerfumeI | null>(perfume || null)
  const [perfumeAmount, setPerfumeAmount] = useState<string>("")

  const inputRef = useRef<HTMLInputElement | null>(null)
  const submit = useSubmit()

  const handleClick = (item: UserPerfumeI) => {
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

  useEffect(() => {
    if (perfume) {
      setSelectedPerfume(perfume)
    }
  }, [perfume])

  return (
    <div>
      <h2> {t('myScents.modal.title')}</h2>
      <p>{t('myScents.modal.description')}</p>
      {modalData === "create" && !perfume && (
        <SearchBar
          searchType="perfume"
          className="mt-4"
          action={handleClick}
        />
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
            label={t('myScents.modal.amountLabel')}
            placeholder={t('myScents.modal.amountPlaceholder')}
            value={perfumeAmount}
            onChange={event => (
              setPerfumeAmount((event.target as HTMLInputElement).value)
            )}
          />
          <Button type="submit" className="mt-6">{t('myScents.modal.submitButton')}</Button>
        </Form>
      )}
    </div>
  )
}

export default MyScentsModal
