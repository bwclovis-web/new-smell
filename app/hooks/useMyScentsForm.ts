//TODO refactor this file to use a more structured approach for managing form state

import React from "react"
import { useCallback, useEffect, useState } from "react"
import { useSubmit } from "react-router"

import type { UserPerfumeI } from "~/types"

// Helper functions to get initial state values
function getInitialPerfumeState(initialPerfume?: UserPerfumeI) {
  return initialPerfume || null
}

// eslint-disable-next-line complexity
const getInitialPerfumeData = (initialPerfume?: UserPerfumeI) => ({
  amount: initialPerfume?.amount || "",
  price: initialPerfume?.price || "",
  placeOfPurchase: initialPerfume?.placeOfPurchase || "",
  type: initialPerfume?.type || ""
})

// Custom hook to manage perfume form state
export function useMyScentsForm(initialPerfume?: UserPerfumeI) {
  const submit = useSubmit()

  // Initialize state with helper functions
  const [selectedPerfume, setSelectedPerfume] =
    useState<UserPerfumeI | null>(getInitialPerfumeState(initialPerfume))
  const initialData = getInitialPerfumeData(initialPerfume)
  const [perfumeData, setPerfumeData] = useState(initialData)

  // Define callbacks
  const resetForm = useCallback(() => {
    setSelectedPerfume(null)
    setPerfumeData({ amount: "", price: "", placeOfPurchase: "", type: "" })
  }, [])

  const handleClick = useCallback((item: UserPerfumeI) => {
    setSelectedPerfume(item)
    setPerfumeData({
      amount: item.amount || "",
      price: item.price || "",
      placeOfPurchase: item.placeOfPurchase || "",
      type: item.type || ""
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
        price: initialPerfume.price || "",
        placeOfPurchase: initialPerfume.placeOfPurchase || "",
        type: initialPerfume.type || ""
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
