
import { useContext, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Form, useSubmit } from "react-router"

import { Button } from "~/components/Atoms/Button/Button"
import RangeSlider from "~/components/Atoms/RangeSlider/RangeSlider"
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
          <fieldset>
            <legend className="text-lg font-black tracking-wide">
              {t('myScents.modal.selectedPerfume')}
            </legend>
            <p className="text-noir-dark dark:text-white mb-4 font-semibold">{selectedPerfume.name}</p>
            <RangeSlider
              min={0}
              max={100}
              step={1}
              value={(parseFloat(perfumeAmount) || 0) * 10}
              onChange={value => {
                const actualValue = value / 10
                setPerfumeAmount(actualValue.toFixed(1))
              }}
              formatValue={value => (value / 10).toFixed(1)}
              label={t('myScents.modal.amountLabel')}
            />
          </fieldset>
          <Button type="submit" className="mt-6">{t('myScents.modal.submitButton')}</Button>
        </Form>
      )}
    </div>
  )
}

export default MyScentsModal
