import { type ChangeEvent, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { type MetaFunction, useLoaderData } from "react-router"

import Select from "~/components/Atoms/Select"
import SearchBar from "~/components/Organisms/SearchBar"
import { getAllFeatures } from "~/models/feature.server"
import { prisma } from "~/db.server"

import banner from "../images/landing.webp"

export const meta: MetaFunction = () => {
  const { t } = useTranslation()
  return [
    { title: t("home.meta.title") },
    { name: "description", content: t("home.meta.description") },
  ]
}

export async function loader() {
  const features = await getAllFeatures()
  const [userCount, houseCount, perfumeCount] = await Promise.all([
    prisma.user.count(),
    prisma.perfumeHouse.count(),
    prisma.perfume.count(),
  ])
  return {
    features,
    counts: {
      users: userCount,
      houses: houseCount,
      perfumes: perfumeCount,
    },
  }
}

export default function Home() {
  const [searchType, setSearchType] = useState<"perfume-house" | "perfume">("perfume")
  const container = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()
  const { counts } = useLoaderData<typeof loader>()

  // Lazy load GSAP animations after component mounts
  useEffect(() => {
    // Dynamic import GSAP only when needed
    const loadAnimations = async () => {
      const [{ gsap }, { useGSAP: useGSAPHook }] = await Promise.all([
        import("gsap"),
        import("@gsap/react"),
      ])

      if (!container.current) return

      gsap.fromTo(
        ".hero-image",
        { filter: "grayscale(100%) contrast(0.5) brightness(0.4)" },
        { filter: "grayscale(100%) contrast(1.4) brightness(0.9)", duration: 2 }
      )
      gsap.from(".hero-title", {
        opacity: 0,
        y: 50,
        duration: 1.2,
        ease: "power2.out",
      })
      gsap.fromTo(
        ".subtitle",
        {
          opacity: 0,
          filter: "blur(6px)",
          y: 20,
        },
        {
          opacity: 1,
          filter: "blur(0px)",
          y: 0,
          duration: 2,
          delay: 1.2,
          ease: "power3.out",
        }
      )
    }

    // Defer animations until after initial render
    requestAnimationFrame(() => {
      loadAnimations()
    })
  }, [])

  const handleSelectType = (evt: ChangeEvent<HTMLSelectElement>) => {
    setSearchType(evt.target.value as "perfume-house" | "perfume")
  }
  const data = [
    {
      id: "perfume-house",
      name: t("home.radio.houses"),
      label: t("home.radio.houses"),
    },
    {
      id: "perfume",
      name: t("home.radio.perfumes"),
      label: t("home.radio.perfumes"),
    },
  ]
  return (
    <div className="relative z-10 top-0 pb-20 md:pb-0">
      <div
        className="flex flex-col gap-8 items-center md:justify-center min-h-screen px-4 relative bg-noir-gold-500/30"
        ref={container}
      >
        <img
          src={banner}
          alt=""
          className="absolute object-cover w-full h-full filter grayscale-[100%] sepia-[0.5] mix-blend-multiply"
        />
        <div className="absolute inset-0 bg-noir-black/85 mask-radial-from-10% mask-radial-to-74% md:mask-radial-from-25% md:mask-radial-to-44%"></div>
        <section className="text-noir-gold relative z-10 flex flex-col items-center gap-4 pt-40 md:pt-0">
          <div className="text-shadow-lg/90 text-shadow-noir-black text-center">
            <h1 className="hero-title">{t("home.heading")}</h1>
            <p className="subtitle opacity-0">{t("home.subheading")}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 mt-4 mb-6">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-noir-gold">
                {counts.users.toLocaleString('en-US')}
              </div>
              <div className="text-sm md:text-base text-noir-gold/80">
                {t("home.stats.users", { count: counts.users })}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-noir-gold">
                {counts.houses.toLocaleString('en-US')}
              </div>
              <div className="text-sm md:text-base text-noir-gold/80">
                {t("home.stats.houses", { count: counts.houses })}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-noir-gold">
                {counts.perfumes.toLocaleString('en-US')}
              </div>
              <div className="text-sm md:text-base text-noir-gold/80">
                {t("home.stats.perfumes", { count: counts.perfumes })}
              </div>
            </div>
          </div>
          <div className="flex flex-col-reverse md:flex-row items-baseline justify-start w-full max-w-4xl mt-6 gap-4 md:gap-0">
            <Select
              size="expanded"
              value={searchType}
              action={handleSelectType}
              selectId="search-type"
              selectData={data}
              ariaLabel={t("components.search.ariaLabel")}
            />
            <SearchBar
              searchType={searchType}
              variant="home"
              className="mt-2 md:mt-8 w-full"
            />
          </div>
        </section>
      </div>
    </div>
  )
}
