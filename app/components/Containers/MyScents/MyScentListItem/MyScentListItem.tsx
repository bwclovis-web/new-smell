import { type Dispatch, type SetStateAction, useRef } from "react"
import { useTranslation } from "react-i18next"
import { MdDeleteForever } from "react-icons/md"
import { useFetcher, useNavigation } from "react-router"

import { Button } from "~/components/Atoms/Button"
import VooDooDetails from "~/components/Atoms/VooDooDetails"
import { useSessionStore } from "~/stores/sessionStore"
import type { UserPerfumeI } from "~/types"

import CommentsModal from "../CommentsModal"
import GeneralDetails from "./bones/GeneralDetails"
import PerfumeComments from "./bones/PerfumeComments"

interface MySentListItemI {
  userPerfume: UserPerfumeI
  setUserPerfumes: Dispatch<SetStateAction<UserPerfumeI[]>>
  userPerfumes: UserPerfumeI[]
}

const MyScentsListItem = ({
  userPerfume,
  setUserPerfumes,
  userPerfumes,
}: MySentListItemI) => {
  const { t } = useTranslation()
  const fetcher = useFetcher()
  const navigation = useNavigation()
  const { toggleModal, closeModal } = useSessionStore()
  
  const isSubmitting = navigation.state === "submitting"
  const removeButtonRef = useRef<HTMLButtonElement>(null)
  

  // Calculate total destashed for this perfume across all entries
  const totalDestashed = userPerfumes
    .filter(up => up.perfumeId === userPerfume.perfumeId)
    .reduce((sum, entry) => {
      const avail = parseFloat(entry.available?.replace(/[^0-9.]/g, "") || "0")
      return sum + (isNaN(avail) ? 0 : avail)
    }, 0)

  const handleRemovePerfume = (userPerfumeId: string) => {
    setUserPerfumes(prev => prev.filter(perfume => perfume.id !== userPerfumeId))

    const formData = new FormData()
    formData.append("userPerfumeId", userPerfumeId)
    formData.append("action", "remove")
    fetcher.submit(formData, { method: "post", action: "/admin/my-scents" })
    closeModal()
  }

  return (
    <>
    {/* {modalOpen && modalId === "delete-item" && (
      <Modal innerType="dark" animateStart="top">
        <DangerModal 
        heading="Are you sure you want to remove this perfume?"
        description="Once removed, you will lose all history, notes and entries in the exchange."
        action={() => handleRemovePerfume(userPerfume.id)} />
      </Modal>
    )}
      {modalOpen && modalId === uniqueModalId && (
        <Modal innerType="dark" animateStart="top">
          <CommentsModal perfume={userPerfume} addComment={addComment} />
        </Modal>
      )} */}
    <li
      key={userPerfume.id}
      className="border p-4 w-full flex flex-col w-full bg-noir-dark/60 text-noir-gold mb-4 last-of-type:mb-0"
    >
      <div className="flex justify-between items-center mb-2 gap-6">
        <div className="flex gap-8 items-center w-full">
          <h3 className="font-medium flex flex-col justify-start items-start text-left">
            <span className="text-xl">{t("myScents.listItem.name")}</span>
            <span className="text-2xl text-noir-gold-100">
              {userPerfume.perfume.name}
            </span>
          </h3>
          <p className="flex flex-col">
            <span className="text-lg font-medium">
              {t("myScents.listItem.total")}
            </span>
            <span className="text-xl text-noir-gold-100">
              {userPerfume.amount} ml
            </span>
          </p>
          <p className="flex flex-col">
            <span className="text-lg font-medium">
              {t("myScents.listItem.destashed")}
            </span>
            <span className="text-xl text-noir-gold-100">
              {totalDestashed.toFixed(1)} ml
            </span>
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            ref={removeButtonRef}
            onClick={() => {
              toggleModal(removeButtonRef, "delete-item")
            }}
            disabled={isSubmitting}
            variant="danger"
            size="sm"
            leftIcon={<MdDeleteForever size={20} fill="white" />}
          >
            <span className="text-white/90 font-bold text-sm">
              {isSubmitting
                ? t("myScents.listItem.removing")
                : t("myScents.listItem.removeButton")}
            </span>
          </Button>
        </div>
      </div>

      <VooDooDetails
        summary={t("myScents.listItem.viewDetails")}
        className="text-start pt-3 mt-3 border-t-noir-gold border-t"
        name="perfume-details"
      >
        <GeneralDetails userPerfume={userPerfume} />
      </VooDooDetails>

      
    </li>
    </>
  )
}

export default MyScentsListItem
