import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { type MetaFunction } from "react-router"

import PendingSubmissionModal from "~/components/Containers/Forms/PendingSubmissionModal"
import { Button } from "~/components/Atoms/Button/Button"
import TitleBanner from "~/components/Organisms/TitleBanner"
import { useSessionStore } from "~/stores/sessionStore"

import banner from "../images/contact.webp"

export const ROUTE_PATH = "/contact-us"

export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t("contactUs.meta.title") },
    { name: "description", content: t("contactUs.meta.description") },
  ]
}

export const loader = async () => ({})

const ContactUsPage = () => {
  const { t } = useTranslation()
  const { toggleModal } = useSessionStore()
  const perfumeButtonRef = useRef<HTMLButtonElement>(null)
  const houseButtonRef = useRef<HTMLButtonElement>(null)

  const handleOpenPerfumeModal = () => {
    if (perfumeButtonRef.current) {
      toggleModal(perfumeButtonRef as React.RefObject<HTMLButtonElement>, "pending-submission-perfume")
    }
  }

  const handleOpenHouseModal = () => {
    if (houseButtonRef.current) {
      toggleModal(houseButtonRef as React.RefObject<HTMLButtonElement>, "pending-submission-perfume_house")
    }
  }

  return (
    <section>
      <TitleBanner
        image={banner}
        heading={t("contactUs.heading")}
        subheading={t("contactUs.subheading")}
      />

      <article className="inner-container py-12">
        <div className="max-w-4xl mx-auto md:px-4 md:max-w-full">
          <div className="prose prose-lg prose-invert max-w-none">
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Contact Section */}
              <section className="flex flex-col gap-6 border-b-4 lg:border-r-4 border-double border-noir-gold lg:px-6 pb-10 lg:pb-0 lg:border-b-0">
                <h2 className="text-noir-gold text-3xl font-bold mb-4">
                  {t("contactUs.contact.title")}
                </h2>
                <div className="flex flex-col gap-4 text-noir-light leading-relaxed text-lg">
                  <p>{t("contactUs.contact.description")}</p>
                  <div className="flex flex-col gap-2">
                    <p className="font-semibold text-noir-gold">
                      {t("contactUs.contact.emailLabel")}
                    </p>
                    <a
                      href={`mailto:${t("contactUs.contact.email")}`}
                      className="text-noir-gold hover:text-noir-light transition-colors"
                    >
                      {t("contactUs.contact.email")}
                    </a>
                  </div>
                </div>
              </section>

              {/* FAQ Section */}
              <section className="flex flex-col gap-6">
                <h2 className="text-noir-gold text-3xl font-bold mb-4">
                  {t("contactUs.faq.title")}
                </h2>
                <div className="flex flex-col gap-8">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <div key={num} className="flex flex-col gap-3 border-b border-noir-gold/30 pb-6">
                      <h3 className="text-noir-gold text-xl font-semibold">
                        {t(`contactUs.faq.question${num}`)}
                      </h3>
                      <p className="text-noir-light leading-relaxed text-lg">
                        {t(`contactUs.faq.answer${num}`)}
                      </p>
                      {num === 1 && (
                        <div className="flex flex-col sm:flex-row gap-3 mt-4">
                          <Button
                            ref={perfumeButtonRef}
                            onClick={handleOpenPerfumeModal}
                            variant="secondary"
                            className="max-w-max"
                          >
                            {t("contactUs.faq.submitPerfumeButton")}
                          </Button>
                          <Button
                            ref={houseButtonRef}
                            onClick={handleOpenHouseModal}
                            variant="secondary"
                            className="max-w-max"
                          >
                            {t("contactUs.faq.submitHouseButton")}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </article>

      {/* Modals */}
      <PendingSubmissionModal submissionType="perfume" />
      <PendingSubmissionModal submissionType="perfume_house" />
    </section>
  )
}

export default ContactUsPage

