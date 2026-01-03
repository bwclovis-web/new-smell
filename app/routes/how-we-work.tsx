import { useTranslation } from "react-i18next"
import { type MetaFunction } from "react-router"

import { OptimizedImage } from "~/components/Atoms/OptimizedImage"
import TitleBanner from "~/components/Organisms/TitleBanner"

import decant from '../images/decant.webp'
import leftBehind from "../images/left.webp"
import matchImage from "../images/match.webp"
import banner from "../images/work.webp"
import trade from "../images/workTrade.webp"
import wishlist from "../images/workWish.webp"


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
        <article className="mx-auto">
          <div className="prose prose-lg prose-invert gap-10 flex flex-col">
            <section className="gap-6 flex flex-col lg:flex-row border-b border-noir-gold pb-10 items-center">
              <OptimizedImage
                src={matchImage}
                alt=""
                width={840}
                height={840}
                className="w-full mb-5 md:mb-10 lg:w-3/4 xl:w-2/3 max-w-4xl aspect-[5/4] rounded-xl bg-transparent border-8 border-noir-light shadow-lg shadow-black filter grayscale-[10%] contrast-[1] brightness-[0.9] sepia-[0.5] mix-blend-overlay"
                sizes="(min-width: 1440px) 55vw, (min-width: 1024px) 65vw, 80vw"
                objectFit="cover"
                placeholder="blur"
              />
              <div className="flex flex-col gap-6 lg:w-1/2">
                <h2 className="md:mb-6">
                  {t("howItWorks.section1.title")}
                </h2>
                <p className="text-noir-light text-xl mb-6 leading-relaxed">
                  {t("howItWorks.section1.content")}
                </p>
                <p className="text-noir-light text-xl mb-6 leading-relaxed">
                  {t("howItWorks.section1.content2")}
                </p>
              </div>
            </section>

            <section className="gap-6 flex flex-col lg:flex-row-reverse border-b border-noir-gold pb-10 items-center">
              <OptimizedImage
                src={decant}
                alt=""
                width={1040}
                height={840}
                className="w-full mb-5 md:mb-10 lg:w-3/4 xl:w-2/3 max-w-4xl aspect-[5/4] rounded-xl bg-transparent border-8 border-noir-light shadow-lg shadow-black filter grayscale-[10%] contrast-[1] brightness-[0.9] sepia-[0.5] mix-blend-overlay"
                sizes="(min-width: 1440px) 55vw, (min-width: 1024px) 65vw, 90vw"
                objectFit="cover"
                placeholder="blur"
              />
              <div className="flex flex-col gap-6 lg:w-1/2">
                <h2 className="md:mb-6">
                  {t("howItWorks.section2.title")}
                </h2>
                <p className="text-noir-light text-xl leading-relaxed mb-6">
                  {t("howItWorks.section2.content")}
                </p>
                <p className="text-noir-light text-xl leading-relaxed mb-6">
                  {t("howItWorks.section2.content2")}
                </p>
              </div>
            </section>

            <section className="gap-6 flex flex-col lg:flex-row border-b border-noir-gold pb-10 items-center">
              <OptimizedImage
                src={wishlist}
                alt=""
                width={1040}
                height={840}
                className="w-full mb-5 md:mb-10 lg:w-3/4 xl:w-2/3 max-w-4xl aspect-[5/4] rounded-xl bg-transparent border-8 border-noir-light shadow-lg shadow-black filter grayscale-[10%] contrast-[1] brightness-[1.1] sepia-[0.5] mix-blend-overlay"
                sizes="(min-width: 1440px) 55vw, (min-width: 1024px) 65vw, 90vw"
                objectFit="cover"
                placeholder="blur"
              />
              <div className="flex flex-col gap-6 lg:w-1/2">
                <h2 className="md:mb-6">
                  {t("howItWorks.section3.title")}
                </h2>
                <p className="text-noir-light text-xl leading-relaxed mb-6">
                  {t("howItWorks.section3.content")}
                </p>
                <p className="text-noir-light text-xl leading-relaxed mb-6">
                  {t("howItWorks.section3.content2")}
                </p>
              </div>
            </section>

            <section className="gap-6 flex flex-col lg:flex-row-reverse border-b border-noir-gold pb-10 items-center">
              <OptimizedImage
                src={trade}
                alt=""
                width={1040}
                height={840}
                className="w-full mb-5 md:mb-10 lg:w-3/4 xl:w-2/3 max-w-4xl aspect-[5/4] rounded-xl bg-transparent border-8 border-noir-light shadow-lg shadow-black filter grayscale-[10%] contrast-[1] brightness-[0.9] sepia-[0.5] mix-blend-overlay"
                sizes="(min-width: 1440px) 55vw, (min-width: 1024px) 65vw, 90vw"
                objectFit="cover"
                placeholder="blur"
              />
              <div className="flex flex-col gap-6 lg:w-1/2">
                <h2 className="md:mb-6">
                {t("howItWorks.section4.title")}
              </h2>
                <p className="text-noir-light text-xl leading-relaxed mb-6">
                {t("howItWorks.section4.content")}
              </p>
              <p className="text-noir-light text-xl leading-relaxed mb-6">
                {t("howItWorks.section4.content2")}
              </p>
              </div>
            </section>
            <section className="gap-6 flex flex-col lg:flex-row border-b border-noir-gold pb-10 items-center">
            <OptimizedImage
                src={leftBehind}
                alt=""
                width={1040}
                height={840}
                className="w-full mb-5 md:mb-10 lg:w-3/4 xl:w-2/3 max-w-4xl aspect-[5/4] rounded-xl bg-transparent border-8 border-noir-light shadow-lg shadow-black filter grayscale-[10%] contrast-[1] brightness-[0.9] sepia-[0.9] mix-blend-overlay"
                sizes="(min-width: 1440px) 55vw, (min-width: 1024px) 65vw, 90vw"
                objectFit="cover"
                placeholder="blur"
              />
             <div className="flex flex-col gap-6 lg:w-1/2">
                <h2 className="md:mb-6">
                {t("howItWorks.section5.title")}
              </h2>
                <p className="text-noir-light text-xl leading-relaxed mb-6">
                {t("howItWorks.section5.content")}
              </p>
             </div>
            </section>
          </div>
        </article>
      </section>
    </section>
  )
}

export default HowWeWorkPage
