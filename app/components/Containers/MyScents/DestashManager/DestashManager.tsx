import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { MdEdit, MdDelete, MdAdd } from "react-icons/md"
import { useFetcher, useRevalidator } from "react-router"

import { Button } from "~/components/Atoms/Button"
import type { UserPerfumeI } from "~/types"

import DestashForm from "../DeStashForm/DeStashForm"
import DestashItem from "./DestashItem"

interface DestashManagerProps {
  perfumeId: string
  userPerfumes: UserPerfumeI[]
  setUserPerfumes: React.Dispatch<React.SetStateAction<UserPerfumeI[]>>
}

const DestashManager = ({
  perfumeId,
  userPerfumes,
  setUserPerfumes,
}: DestashManagerProps) => {
  const { t } = useTranslation()
  const fetcher = useFetcher()
  const revalidator = useRevalidator()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const previousStateRef = useRef<string>(fetcher.state)

  // Revalidate data after successful fetcher submission
  useEffect(() => {
    // Only update when transitioning from "submitting" to "idle"
    if (
      previousStateRef.current === "submitting" &&
      fetcher.state === "idle"
    ) {
      // Check if the response indicates success
      const responseData = fetcher.data
      const isSuccess = responseData && typeof responseData === 'object' && 'success' in responseData
        ? responseData.success
        : true // Assume success if format is different

      if (isSuccess && responseData?.userPerfume) {
        // Update or add the entry to local state
        const updatedUserPerfume = responseData.userPerfume
        setUserPerfumes(prev => {
          const index = prev.findIndex(up => up.id === updatedUserPerfume.id)
          if (index >= 0) {
            // Update existing entry
            const updated = [...prev]
            updated[index] = updatedUserPerfume
            return updated
          }
          // Add new entry (new destash was created)
          return [...prev, updatedUserPerfume]
        })
      }

      // Always revalidate to ensure data is fresh
      revalidator.revalidate()
    }
    previousStateRef.current = fetcher.state
  }, [fetcher.state, fetcher.data, revalidator, setUserPerfumes])

  // Filter destashes for this perfume
  const destashes = userPerfumes.filter(
    up => up.perfumeId === perfumeId && parseFloat(up.available || "0") > 0
  )

  // Calculate total owned and total destashed for this perfume
  const entriesForPerfume = userPerfumes.filter(up => up.perfumeId === perfumeId)
  const totalOwned = entriesForPerfume.reduce((sum, entry) => {
    const amt = parseFloat(entry.amount?.replace(/[^0-9.]/g, "") || "0")
    return sum + (isNaN(amt) ? 0 : amt)
  }, 0)
  const totalDestashed = entriesForPerfume.reduce((sum, entry) => {
    const avail = parseFloat(entry.available?.replace(/[^0-9.]/g, "") || "0")
    return sum + (isNaN(avail) ? 0 : avail)
  }, 0)

  const handleCreateNew = () => {
    setIsCreating(true)
    setEditingId(null)
  }

  const handleEdit = (id: string) => {
    setEditingId(id)
    setIsCreating(false)
  }

  const handleCancel = () => {
    setEditingId(null)
    setIsCreating(false)
  }

  const handleDelete = (userPerfumeId: string) => {
    if (
      !confirm(
        t("myScents.destashManager.confirmDelete")
      )
    ) {
      return
    }

    // Instead of deleting the entry, set available amount to 0 to remove the destash
    // This preserves the perfume in the collection
    const destash = userPerfumes.find(up => up.id === userPerfumeId)
    if (destash) {
      setUserPerfumes(prev =>
        prev.map(perfume =>
          perfume.id === userPerfumeId
            ? { ...perfume, available: "0" }
            : perfume
        )
      )

      const formData = new FormData()
      formData.append("action", "decant")
      formData.append("userPerfumeId", userPerfumeId)
      formData.append("availableAmount", "0")
      fetcher.submit(formData, { method: "post", action: "/admin/my-scents" })
    }
  }

  const handleDecantConfirm = (data: {
    amount: string
    price?: string
    tradePreference: "cash" | "trade" | "both"
    tradeOnly: boolean
    createNew?: boolean
  }) => {
    const formData = new FormData()
    formData.append("perfumeId", perfumeId)

    const shouldEdit = editingId && !isCreating && !data.createNew

    if (shouldEdit) {
      // Editing existing destash
      formData.append("action", "decant")
      formData.append("userPerfumeId", editingId)
      formData.append("availableAmount", data.amount)
      if (data.price) {
        formData.append("tradePrice", data.price)
      }
    } else {
      // Creating new destash entry
      formData.append("action", "create-decant")
      formData.append("amount", data.amount)
      if (data.price) {
        formData.append("tradePrice", data.price)
      }
    }

    formData.append("tradePreference", data.tradePreference)
    formData.append("tradeOnly", data.tradeOnly.toString())

    fetcher.submit(formData, { method: "post", action: "/admin/my-scents" })
    // Close the form immediately - the revalidator will refresh the data
    setIsCreating(false)
    setEditingId(null)
  }

  const editingDestash = editingId
    ? userPerfumes.find(up => up.id === editingId)
    : null

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="!text-noir-dark text-xl font-semibold">
          {t("myScents.destashManager.title")}
        </h3>
        {!isCreating && !editingId && (
          <Button
            onClick={handleCreateNew}
            variant="primary"
            size="sm"
            leftIcon={<MdAdd size={18} />}
          >
            {t("myScents.destashManager.addNew")}
          </Button>
        )}
      </div>

      <p className="text-sm text-noir-gold-500">
        {t("myScents.destashManager.description")}
      </p>

      {/* List of existing destashes */}
      {!isCreating && !editingId && (
        <div className="space-y-3">
          {destashes.length === 0 ? (
            <p className="text-noir-gold-300 italic text-center py-4">
              {t("myScents.destashManager.noDestashes")}
            </p>
          ) : (
            destashes.map(destash => (
              <DestashItem
                key={destash.id}
                destash={destash}
                onEdit={() => handleEdit(destash.id)}
                onDelete={() => handleDelete(destash.id)}
              />
            ))
          )}
        </div>
      )}

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="noir-border p-4 bg-noir-dark/30">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-noir-gold">
              {isCreating
                ? t("myScents.destashManager.createNew")
                : t("myScents.destashManager.editDestash")}
            </h4>
            <Button onClick={handleCancel} variant="secondary" size="sm">
              {t("myScents.destashManager.cancel")}
            </Button>
          </div>
          {editingDestash && (
            <DestashForm
              key={`edit-${editingDestash.id}`}
              userPerfume={editingDestash}
              handleDecantConfirm={handleDecantConfirm}
              isEditing={true}
              maxAvailable={totalOwned > 0
                ? totalOwned - totalDestashed + parseFloat(editingDestash.available || "0")
                : undefined}
            />
          )}
          {isCreating && (
            <DestashForm
              key="create-new"
              userPerfume={
                userPerfumes.find(up => up.perfumeId === perfumeId) ||
                userPerfumes[0]
              }
              handleDecantConfirm={handleDecantConfirm}
              isCreating={true}
              maxAvailable={totalOwned > 0 ? totalOwned - totalDestashed : undefined}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default DestashManager
