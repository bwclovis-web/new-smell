import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useFetcher } from "react-router"

import { Button } from "~/components/Atoms/Button/Button"
import ContactTraderModal from "~/components/Containers/Forms/ContactTraderModal"
import Modal from "~/components/Organisms/Modal/Modal"
import { useSessionStore } from "~/stores/sessionStore"
import { getTraderDisplayName } from "~/utils/user"

interface ContactTraderButtonProps {
  traderId: string
  trader: {
    id: string
    firstName?: string | null
    lastName?: string | null
    username?: string | null
  }
  viewerId?: string | null
}

const ContactTraderButton = ({
  traderId,
  trader,
  viewerId,
}: ContactTraderButtonProps) => {
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
  
  // Monitor fetcher state changes and manually fetch response if needed
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      setManualResult(null) // Clear manual result if fetcher has data
    }
  }, [fetcher.state, fetcher.data])

  const handleSubmit = async (formData: FormData) => {
    // Submit using fetcher - this should NOT navigate
    // fetcher.submit() is designed for background submissions
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
        className="w-full"
        onClick={() => {
          toggleModal(modalTrigger, "contact-trader", {
            traderId,
            traderName,
          })
        }}
        ref={modalTrigger}
      >
        {t("contactTrader.button", "Contact Trader")}
      </Button>

      {modalOpen && modalId === "contact-trader" && (
        <Modal background="default" innerType="form" animateStart="top">
          <ContactTraderModal
            recipientId={traderId}
            recipientName={traderName}
            lastResult={lastResult}
            onSubmit={handleSubmit}
            onSuccess={handleSuccess}
          />
        </Modal>
      )}
    </>
  )
}

export default ContactTraderButton



