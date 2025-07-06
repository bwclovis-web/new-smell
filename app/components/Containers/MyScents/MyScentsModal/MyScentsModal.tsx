
import { getFormProps, useForm } from "@conform-to/react"
import React, { useCallback, useContext, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Form, useSubmit } from "react-router"

import { Button } from "~/components/Atoms/Button/Button"
import Input from "~/components/Atoms/Input/Input"
import RangeSlider from "~/components/Atoms/RangeSlider/RangeSlider"
import SearchBar from "~/components/Organisms/SearchBar/SearchBar"
import SessionContext from "~/providers/sessionProvider"
import type { UserPerfumeI } from "~/types"

interface MyScentsModalProps {
  perfume?: UserPerfumeI
}

// Custom hook to manage perfume form state
function useMyScentsForm(initialPerfume?: UserPerfumeI) {
  const [selectedPerfume, setSelectedPerfume] =
    useState<UserPerfumeI | null>(initialPerfume || null)
  const [perfumeData, setPerfumeData] = useState({
    amount: "",
    price: "",
    placeOfPurchase: ""
  })
  const submit = useSubmit()

  const resetForm = useCallback(() => {
    setSelectedPerfume(null)
    setPerfumeData({ amount: "", price: "", placeOfPurchase: "" })
  }, [])

  const handleClick = useCallback((item: UserPerfumeI) => {
    setSelectedPerfume(item)
    setPerfumeData({
      amount: item.amount || "",
      price: item.price || "",
      placeOfPurchase: item.placeOfPurchase || ""
    })
  }, [])

  // Create form data
  const createFormData = useCallback(() => {
    if (!selectedPerfume) {
      return null
    }

    const formData = new FormData()
    formData.append("perfumeId", selectedPerfume.id)
    formData.append("amount", perfumeData.amount)
    formData.append("price", perfumeData.price)
    formData.append("placeOfPurchase", perfumeData.placeOfPurchase)
    formData.append("action", "add")

    return formData
  }, [selectedPerfume, perfumeData])

  // Submit the form
  const handleAddPerfume = useCallback((evt: React.FormEvent) => {
    evt.preventDefault()

    const formData = createFormData()
    if (!formData) {
      return
    }

    submit(formData, { method: "post", action: "/admin/my-scents" })
    resetForm()
  }, [createFormData, resetForm, submit])

  // Update state when perfume changes
  useEffect(() => {
    if (initialPerfume) {
      setSelectedPerfume(initialPerfume)
      setPerfumeData({
        amount: initialPerfume.amount || "",
        price: (initialPerfume as any).price || "",
        placeOfPurchase: (initialPerfume as any).placeOfPurchase || ""
      })
    }
  }, [initialPerfume])

  return {
    selectedPerfume,
    perfumeData,
    setPerfumeData,
    handleClick,
    handleAddPerfume
  }
}

const MyScentsModal = ({ perfume }: MyScentsModalProps) => {
  const { modalData } = useContext(SessionContext)
  const { t } = useTranslation()
  const priceInputRef = useRef<HTMLInputElement>(null)
  const placeInputRef = useRef<HTMLInputElement>(null)
  const [form] = useForm({
    id: "perfume-form"
  })

  const {
    selectedPerfume,
    perfumeData,
    setPerfumeData,
    handleClick,
    handleAddPerfume
  } = useMyScentsForm(perfume)

  useEffect(() => {
    if (perfume) {
      setPerfumeData({
        amount: perfume.amount || "",
        price: perfume.price || "",
        placeOfPurchase: perfume.placeOfPurchase || ""
      })
    }
  }, [perfume])



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
                <Input
                  inputType="number"
                  name="price"
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
                  placeholder={t('myScents.modal.pricePlaceholder') || "Price"}
                />
                <Input
                  inputType="text"
                  name="placeOfPurchase"
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
                  placeholder={t('myScents.modal.purchasePlaceholder') || "Place of purchase"}
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
