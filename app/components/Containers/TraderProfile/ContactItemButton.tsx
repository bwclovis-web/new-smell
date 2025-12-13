import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useFetcher } from "react-router"

import { Button } from "~/components/Atoms/Button/Button"
import ContactTraderModal from "~/components/Containers/Forms/ContactTraderModal"
import Modal from "~/components/Organisms/Modal/Modal"
import { useSessionStore } from "~/stores/sessionStore"
import { getTraderDisplayName } from "~/utils/user"
import type { UserPerfumeI } from "~/types"

interface ContactItemButtonProps {
  traderId: string
  trader: {
    id: string
    firstName?: string | null
    lastName?: string | null
    username?: string | null
  }
  userPerfume: UserPerfumeI
  viewerId?: string | null
}

const ContactItemButton = ({
  traderId,
  trader,
  userPerfume,
  viewerId,
}: ContactItemButtonProps) => {
  const { t } = useTranslation()
  const { modalOpen, toggleModal, modalId, closeModal } = useSessionStore()
  const modalTrigger = useRef<HTMLButtonElement>(null)
  const fetcher = useFetcher()

  // Only show button if viewer is authenticated and not viewing their own profile
  if (!viewerId || viewerId === traderId) {
    return null
  }

  const traderName = getTraderDisplayName(trader)
  const [manualResult, setManualResult] = useState<any>(null)
  
  // Use fetcher.data if available, otherwise use manually tracked result
  const lastResult = fetcher.data || manualResult

  // Generate item-specific modal ID to allow multiple item modals
  const itemModalId = `contact-item-${userPerfume.id}`

  // Create item information for the form
  const itemInfo = {
    userPerfumeId: userPerfume.id,
    perfumeName: userPerfume.perfume?.name || "Unknown Perfume",
    perfumeHouse: userPerfume.perfume?.perfumeHouse?.name || "",
    amount: userPerfume.available || "0",
    price: userPerfume.price,
    tradePrice: userPerfume.tradePrice,
    tradePreference: userPerfume.tradePreference,
  }

  // Generate a pre-filled subject line
  const itemSubject = t(
    "contactTrader.itemSubject",
    {
      perfumeName: itemInfo.perfumeName,
      perfumeHouse: itemInfo.perfumeHouse ? ` by ${itemInfo.perfumeHouse}` : "",
    },
    `Inquiry about ${itemInfo.perfumeName}${itemInfo.perfumeHouse ? ` by ${itemInfo.perfumeHouse}` : ""}`
  )

  const handleSubmit = async (formData: FormData) => {
    // Submit using fetcher - this should NOT navigate
    fetcher.submit(formData, {
      method: "POST",
      action: "/api/contact-trader",
    })
    
    // Wait a bit for fetcher to complete, then manually fetch if needed
    // This is a workaround for React Router's fetcher.data not always populating
    setTimeout(async () => {
      if (!fetcher.data && fetcher.state === "idle") {
        try {
          const response = await fetch("/api/contact-trader", {
            method: "POST",
            body: formData,
            credentials: "include", // Include cookies for CSRF
          })
          const data = await response.json()
          setManualResult(data)
        } catch (error) {
          // Silently handle fetch errors - form will show error from fetcher if available
        }
      }
    }, 500)
  }

  const handleSuccess = () => {
    // Close modal after successful submission
    setTimeout(() => {
      closeModal()
    }, 1500)
  }

  return (
    <>
      <Button
        variant="primary"
        background="gold"
        size="sm"
        className="mt-2 w-full"
        onClick={() => {
          toggleModal(modalTrigger, itemModalId, {
            traderId,
            traderName,
            itemInfo,
            itemSubject,
          })
        }}
        ref={modalTrigger}
      >
        {t("contactTrader.inquireButton", "Inquire About This Item")}
      </Button>

      {modalOpen && modalId === itemModalId && (
        <Modal background="dark" innerType="form" animateStart="top">
          <ContactTraderModal
            recipientId={traderId}
            recipientName={traderName}
            lastResult={lastResult}
            onSubmit={handleSubmit}
            onSuccess={handleSuccess}
            itemInfo={itemInfo}
            itemSubject={itemSubject}
          />
        </Modal>
      )}
    </>
  )
}

export default ContactItemButton



