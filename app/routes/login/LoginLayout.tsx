import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { Outlet } from "react-router"

import { OptimizedImage } from "~/components/Atoms/OptimizedImage"
import { VooDooLink } from "~/components/Atoms/Button"
import banner from "~/images/password.webp"

import { ROUTE_PATH as SIGN_UP_PATH } from "./SignUpPage"
const RootLayout = () => {
  const container = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()
  return (
    <div
      className="flex flex-col gap-8 items-center justify-center min-h-screen px-4 bg-noir-gold-500/30"
      ref={container}
    >
      <OptimizedImage
        src={banner}
        alt=""
        width={1200}
        height={800}
        priority={true}
        quality={85}
        className="hero-image absolute object-cover w-full h-full filter grayscale-[100%] sepia-[0.2]"
        sizes="100vw"
        placeholder="blur"
      />
      <div className="absolute inset-0  md:mask-radial-from-45% mask-radial-to-64%"></div>
      <div className="relative w-full flex flex-col items-center justify-around gap-4 md:gap-8 mx-auto">
        <div className="mx-auto min-w-1/3 relative noir-border py-5 px-3 bg-noir-dark/10 shadow-md text-noir-gold content text-center">
          <h1 className=" text-shadow-lg text-shadow-black">{t("auth.heading")}</h1>
          <p className="subtitle mb-4">
            {t("auth.subheading")}
            </p>
            <VooDooLink
              variant="link"
              size="md"
              className="block"
              url={SIGN_UP_PATH}
            >
              {t("auth.createAccount")}
            </VooDooLink>
        </div>
        <div className="w-full lg:w-1/2 form ">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default RootLayout
