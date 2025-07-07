import { getFormProps, useForm } from "@conform-to/react"
import { useContext, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Form } from "react-router"

import { Button } from "~/components/Atoms/Button/Button"
import Input from "~/components/Atoms/Input/Input"
import RangeSlider from "~/components/Atoms/RangeSlider/RangeSlider"
import Select from "~/components/Atoms/Select/Select"
import SearchBar from "~/components/Organisms/SearchBar/SearchBar"
import { perfumeTypes } from "~/data/SelectTypes"
import { useMyScentsForm } from "~/hooks/useMyScentsForm"
import SessionContext from "~/providers/sessionProvider"
import type { UserPerfumeI } from "~/types"

interface MyScentsModalProps {
  perfume?: UserPerfumeI
}

const MyScentsModal = ({ perfume }: MyScentsModalProps) => {
  const { modalData } = useContext(SessionContext)
  const { t } = useTranslation()

  const priceInputRef = useRef<HTMLInputElement>(null)
  const placeInputRef = useRef<HTMLInputElement>(null)

  const [form] = useForm({
    id: "perfume-form"
  })

  // Custom hook calls last
  const {
    selectedPerfume,
    perfumeData,
    setPerfumeData,
    handleClick,
    handleAddPerfume
  } = useMyScentsForm(perfume)

  return (
    <div className="w-full">
      <div className="flex  items-center justify-between mb-4">
        <div>
          <h2> {t('myScents.modal.title')}</h2>
          <p>{t('myScents.modal.description')}</p>
        </div>
        {modalData === "create" && !perfume && (
          <SearchBar
            searchType="perfume"
            className="mt-4"
            action={(item: any) => handleClick(item as UserPerfumeI)}
          />
        )}
      </div>

      {selectedPerfume && (
        <Form
          method="POST"
          className="mt-4"
          {...getFormProps(form)}
          onSubmit={handleAddPerfume}
        >
          <fieldset>
            <legend className="text-lg font-black tracking-wide">
              {t('myScents.modal.selectedPerfume')}
            </legend>
            <p className="text-noir-dark dark:text-white mb-4 font-semibold">{selectedPerfume.name}</p>
            <div className="flex items-center justify-between gap-6">
              <div className="w-1/2">
                <RangeSlider
                  min={0}
                  max={10}
                  step={0.1}
                  value={parseFloat(perfumeData.amount) || 0}
                  onChange={value => {
                    setPerfumeData({
                      ...perfumeData,
                      amount: value.toFixed(1)
                    })
                  }}
                  formatValue={value => value.toFixed(1)}
                  label={t('myScents.modal.amountLabel')}
                />
              </div>
              <div className="w-1/2">
                <Select
                  selectData={perfumeTypes}
                  name="type"
                  label={t('myScents.modal.typeLabel')}
                  selectId={""} />
                <Input
                  inputType="number"
                  name="price"
                  label={t('myScents.modal.priceLabel')}
                  value={perfumeData.price}
                  inputRef={priceInputRef}
                  onChange={event => {
                    const target = event.target as HTMLInputElement
                    setPerfumeData({
                      ...perfumeData,
                      price: target.value
                    })
                  }}
                  className="mt-4 w-full"
                  placeholder={t('myScents.modal.pricePlaceholder')}
                />
                <Input
                  inputType="text"
                  name="placeOfPurchase"
                  label={t('myScents.modal.placeOfPurchase')}
                  value={perfumeData.placeOfPurchase}
                  inputRef={placeInputRef}
                  onChange={event => {
                    const target = event.target as HTMLInputElement
                    setPerfumeData({
                      ...perfumeData,
                      placeOfPurchase: target.value
                    })
                  }}
                  className="mt-4 w-full"
                  placeholder={t('myScents.modal.placeOfPurchasePlaceholder')}
                />
              </div>
            </div>
          </fieldset>
          <Button type="submit" className="mt-6">{t('myScents.modal.submitButton')}</Button>
        </Form>
      )}
    </div>
  )
}

export default MyScentsModal
