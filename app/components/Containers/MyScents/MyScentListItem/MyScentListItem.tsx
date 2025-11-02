import { type Dispatch, type SetStateAction } from "react"
import { useTranslation } from "react-i18next"
import { MdDeleteForever } from "react-icons/md"
import { useFetcher, useNavigation } from "react-router"

import { Button } from "~/components/Atoms/Button"
import VooDooDetails from "~/components/Atoms/VooDooDetails"
import DangerModal from "~/components/Organisms/DangerModal"
import Modal from "~/components/Organisms/Modal"
import { useSessionStore } from "~/stores/sessionStore"
import type { UserPerfumeI } from "~/types"

import DeStashForm from "../DeStashForm/DeStashForm"
import GeneralDetails from "./bones/GeneralDetails"
import PerfumeComments from "./bones/PerfumeComments"

interface DeStashData {
  amount: string
  price?: string
  tradePreference: "cash" | "trade" | "both"
  tradeOnly: boolean
}

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
  const { modalOpen, toggleModal, modalId, closeModal } = useSessionStore()
  const isSubmitting = navigation.state === "submitting"

  const updateUserPerfumeState = (amount: string) => {
    setUserPerfumes(prev => prev.map(perfume => perfume.id === userPerfume.id ? { ...perfume, available: amount } : perfume))
  }

  const createDecantFormData = (data: DeStashData, perfumeId: string) => {
    const formData = new FormData()
    formData.append("perfumeId", perfumeId)
    formData.append("availableAmount", data.amount)
    formData.append("action", "decant")

    if (data.price) {
      formData.append("tradePrice", data.price)
    }
    formData.append("tradePreference", data.tradePreference)
    formData.append("tradeOnly", data.tradeOnly.toString())

    return formData
  }

  const handleDecantConfirm = (data: DeStashData) => {
    const foundUserPerfume = userPerfumes.find(item => item.id === userPerfume.id)
    if (!foundUserPerfume) {
       
      console.error("User perfume not found for de-stashing")
      return
    }

    updateUserPerfumeState(data.amount)
    const formData = createDecantFormData(data, foundUserPerfume.perfume.id)
    fetcher.submit(formData, { method: "post", action: "/admin/my-scents" })
  }

  const handleRemovePerfume = (perfumeId: string) => {
    setUserPerfumes(prev => prev.filter(perfume => perfume.perfume.id !== perfumeId))

    const formData = new FormData()
    formData.append("perfumeId", perfumeId)
    formData.append("action", "remove")
    fetcher.submit(formData, { method: "post", action: "/admin/my-scents" })
    closeModal()
  }

  return (
    <>
    {modalOpen && modalId === "delete-item" && (
      <Modal innerType="dark" animateStart="top">
        <DangerModal 
        heading="Are you sure you want to remove this perfume?"
        description="Once removed, you will lose all history, notes and entries in the exchange."
        action={() => handleRemovePerfume(userPerfume.perfume.id)} />
      </Modal>
    )}
    <li
      key={userPerfume.id}
      className="border p-4 flex flex-col w-full bg-noir-dark/60 text-noir-gold mb-4 last-of-type:mb-0"
    >
      <div className="flex justify-between items-center mb-2 gap-6">
        <div className="flex gap-8">
          <h3 className="font-medium flex flex-col justify-start items-start max-w-[40ch] min-w-[40ch] text-left">
            <span className="text-xl">{t("myScents.listItem.name")}</span>
            <span className="text-2xl text-noir-gold-100">
              {userPerfume.perfume.name}
            </span>
          </h3>
          <p className="flex flex-col items-end justify-start">
            <span className="text-lg font-medium">
              {t("myScents.listItem.total")}
            </span>
            <span className="text-xl text-noir-gold-100">
              {userPerfume.amount} ml
            </span>
          </p>
          <p className="flex flex-col items-end justify-start">
            <span className="text-lg font-medium">
              {t("myScents.listItem.destashed")}
            </span>
            <span className="text-xl text-noir-gold-100">
              {userPerfume.available || "0"} ml
            </span>
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            className="bg-red-500/20  hover:bg-red-600/50 focus:bg-red-700 disabled:bg-red-400 border-red-700 gap-2 flex items-center justify-center"
            onClick={() => {
              const buttonRef = { current: document.createElement("button") }
              toggleModal(buttonRef as any, "delete-item", "delete-item")
            }}
            disabled={isSubmitting}
            variant={"icon"}
            size="sm"
          >
            <span className="text-white/90 font-bold text-sm">
              {isSubmitting
                ? t("myScents.listItem.removing")
                : t("myScents.listItem.removeButton")}
            </span>
            <MdDeleteForever size={20} fill="white" />
          </Button>
        </div>
      </div>

      <VooDooDetails
        summary={t("myScents.listItem.viewDetails")}
        className="text-start pt-3 mt-3 border-t-noir-gold border-t"
        name="perfume-details"
      >
        <GeneralDetails userPerfume={userPerfume} />
        <VooDooDetails
          summary={t("myScents.listItem.viewComments")}
          className="text-start text-noir-dark  py-3 mt-3 bg-noir-gold noir-border-dk px-2 relative open:bg-noir-gold-100"
          name="inner-details"
        >
          <PerfumeComments userPerfume={userPerfume} />
        </VooDooDetails>
        <VooDooDetails
          summary={t("myScents.listItem.setDestashed")}
          className="text-start text-noir-dark font-bold py-3 mt-3 bg-noir-gold px-2 rounded noir-border-dk relative open:bg-noir-gold-100"
          name="inner-details"
        >
          <DeStashForm
            handleDecantConfirm={handleDecantConfirm}
            userPerfume={userPerfume}
          />
        </VooDooDetails>
      </VooDooDetails>

      
    </li>
    </>
  )
}

export default MyScentsListItem
