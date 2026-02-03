import { useTranslation } from "react-i18next"

import TitleBanner from "~/components/Organisms/TitleBanner"

import banner from "../images/terms.webp"
const TermsAndConditions = () => {
  const { t } = useTranslation()
  return (
    <article>
      <TitleBanner
        imagePos="object-center"
        image={banner}
        heading={t("termsAndConditions.heading")}
        subheading={t("termsAndConditions.subheading")}
      />
      <section className="inner-container mx-auto mt-8 bg-noir-dark p-8 rounded-lg border border-noir-gold">
        <h2 className="mb-4">1. {t("termsAndConditions.gist.heading")}</h2>
        <div className="flex flex-col gap-4 text-noir-gold-100 text-lg">
          <p>{t("termsAndConditions.gist.contentOne")}</p>
          <p>{t("termsAndConditions.gist.contentTwo")}</p>
        </div>
      </section>
      <section className="inner-container mx-auto mt-8 bg-noir-dark p-8 rounded-lg border border-noir-gold">
        <h2 className="mb-4">
          2. {t("termsAndConditions.tradingAndListing.heading")}
        </h2>
        <div className="flex flex-col gap-4 text-noir-gold-100 text-lg">
          <p>{t("termsAndConditions.tradingAndListing.contentOne")}</p>
          <p>{t("termsAndConditions.tradingAndListing.contentTwo")}</p>
          <p>{t("termsAndConditions.tradingAndListing.contentThree")}</p>
          <p>{t("termsAndConditions.tradingAndListing.contentFour")}</p>
          <p>{t("termsAndConditions.tradingAndListing.contentFive")}</p>
        </div>
      </section>
      <section className="inner-container mx-auto mt-8 bg-noir-dark p-8 rounded-lg border border-noir-gold">
        <h2 className="mb-4">
          3. {t("termsAndConditions.accountsAndConduct.heading")}
        </h2>
        <div className="flex flex-col gap-4 text-noir-gold-100 text-lg">
          <p>{t("termsAndConditions.accountsAndConduct.contentOne")}</p>
          <p>{t("termsAndConditions.accountsAndConduct.contentTwo")}</p>
          <p>{t("termsAndConditions.accountsAndConduct.contentThree")}</p>
        </div>
      </section>
      <section className="inner-container mx-auto mt-8 bg-noir-dark p-8 rounded-lg border border-noir-gold">
        <h2 className="mb-4">
          4. {t("termsAndConditions.reviewsAndNotes.heading")}
        </h2>
        <div className="flex flex-col gap-4 text-noir-gold-100 text-lg">
          <p>{t("termsAndConditions.reviewsAndNotes.contentOne")}</p>
          <p>{t("termsAndConditions.reviewsAndNotes.contentTwo")}</p>
          <p>{t("termsAndConditions.reviewsAndNotes.contentThree")}</p>
        </div>
      </section>
      <section className="inner-container mx-auto mt-8 bg-noir-dark p-8 rounded-lg border border-noir-gold">
        <h2 className="mb-4">5. {t("termsAndConditions.noGuarantee.heading")}</h2>
        <div className="flex flex-col gap-4 text-noir-gold-100 text-lg">
          <p>{t("termsAndConditions.noGuarantee.contentOne")}</p>
        </div>
      </section>
      <section className="inner-container mx-auto mt-8 bg-noir-dark p-8 rounded-lg border border-noir-gold">
        <h2 className="mb-4">6. {t("termsAndConditions.liability.heading")}</h2>
        <div className="flex flex-col gap-4 text-noir-gold-100 text-lg">
          <p>{t("termsAndConditions.liability.contentOne")}</p>
          <p>{t("termsAndConditions.liability.contentTwo")}</p>
        </div>
      </section>
      <section className="inner-container mx-auto mt-8 bg-noir-dark p-8 rounded-lg border border-noir-gold">
        <h2 className="mb-4">7. {t("termsAndConditions.privacy.heading")}</h2>
        <div className="flex flex-col gap-4 text-noir-gold-100 text-lg">
          <p>{t("termsAndConditions.privacy.contentOne")}</p>
        </div>
        <ul className="list-disc list-inside text-noir-gold-100 text-lg">
          <li>{t("termsAndConditions.privacy.contentList.one")}</li>
          <li>{t("termsAndConditions.privacy.contentList.two")}</li>
          <li>{t("termsAndConditions.privacy.contentList.three")}</li>
          <li>{t("termsAndConditions.privacy.contentList.four")}</li>
          <li>{t("termsAndConditions.privacy.contentList.five")}</li>
        </ul>
      </section>
      <section className="inner-container mx-auto mt-8 bg-noir-dark p-8 rounded-lg border border-noir-gold">
        <h2 className="mb-4">8. {t("termsAndConditions.changes.heading")}</h2>
        <div className="flex flex-col gap-4 text-noir-gold-100 text-lg">
          <p>{t("termsAndConditions.changes.contentOne")}</p>
        </div>
      </section>
      <section className="inner-container mx-auto mt-8 bg-noir-dark p-8 rounded-lg border border-noir-gold mb-20">
        <h2 className="mb-4">9. {t("termsAndConditions.closing.heading")}</h2>
        <div className="flex flex-col gap-4 text-noir-gold-100 text-lg">
          <p>{t("termsAndConditions.closing.contentOne")}</p>
        </div>
      </section>
    </article>
  )
}

export default TermsAndConditions
