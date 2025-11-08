import { useTranslation } from "react-i18next"
import { type MetaFunction } from "react-router"

import TitleBanner from "~/components/Organisms/TitleBanner"

import banner from "../images/work.webp"

export const ROUTE_PATH = "/how-we-work"

export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t("howItWorks.meta.title") },
    { name: "description", content: t("howItWorks.meta.description") },
  ]
}

export const loader = async () => ({})

const HowWeWorkPage = () => {
  const { t } = useTranslation()

  return (
    <section>
      <TitleBanner
        image={banner}
        heading={t("howItWorks.heading")}
        subheading={t("howItWorks.subheading")}
      />

      <section className="inner-container py-12">
        <article className="max-w-4xl mx-auto">
          <div className="prose prose-lg prose-invert max-w-none gap-10 flex flex-col">
            <section className="flex flex-col gap-6 border-b border-noir-gold pb-10">
              <h2 className="subtitle mb-6">
                {t("howItWorks.section1.title")}
              </h2>
                <p className="text-noir-light text-lg mb-6 leading-relaxed">
                  {t("howItWorks.section1.content")}
                </p>
                <p className="text-noir-light text-lg mb-6 leading-relaxed">
                  {t("howItWorks.section1.content2")}
                </p>
            </section>

            <section className="flex flex-col gap-6 border-b border-noir-gold pb-10">
              <h2 className="subtitle mb-6">
                {t("howItWorks.section2.title")}
              </h2>
              <p className="text-noir-light text-lg leading-relaxed mb-6">
                {t("howItWorks.section2.content")}
              </p>
              <p className="text-noir-light text-lg leading-relaxed mb-6">
                {t("howItWorks.section2.content2")}
              </p>
            </section>

            <section className="flex flex-col gap-6 border-b border-noir-gold pb-10">
              <h2 className="subtitle mb-6">
                {t("howItWorks.section3.title")}
              </h2>
              <p className="text-noir-light text-lg leading-relaxed mb-6">
                {t("howItWorks.section3.content")}
              </p>
              <p className="text-noir-light text-lg leading-relaxed mb-6">
                {t("howItWorks.section3.content2")}
              </p>
            </section>

            <section className="flex flex-col gap-6 border-b border-noir-gold pb-10">
              <h2 className="subtitle mb-6">
              {t("howItWorks.section4.title")}
            </h2>
              <p className="text-noir-light text-lg leading-relaxed mb-6">
              {t("howItWorks.section4.content")}
            </p>
            <p className="text-noir-light text-lg leading-relaxed mb-6">
              {t("howItWorks.section4.content2")}
            </p>
            </section>
            <section className="flex flex-col gap-6 pb-10">
              <h2 className="subtitle mb-6">
              {t("howItWorks.section5.title")}
            </h2>
              <p className="text-noir-light text-lg leading-relaxed mb-6">
              {t("howItWorks.section5.content")}
            </p>
            </section>
          </div>
        </article>
      </section>
    </section>
  )
}

export default HowWeWorkPage
