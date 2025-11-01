import { useTranslation } from "react-i18next"

import { VooDooLink } from "~/components/Atoms/Button/Button"
import banner from "~/images/notFound.webp"

const FourOFourPage = () => {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center h-screen relative bg-noir-dark">
      <img
        src={banner}
        alt="404 Not Found"
        className="absolute top-0 left-0 w-full h-full object-cover opacity-60"
      />
      <section className="relative top-0 left-0 w-full h-full flex flex-col items-center justify-center bg-noir-dark/10  p-4">
        <div className="bg-white/40 text-center rounded-md shadow-lg backdrop-blur-md p-10">
          <h1 className="font-bold text-white">{t("404.heading")}</h1>
          <p className="mt-4 text-xl mb-4">{t("404.subheading")}</p>
          <VooDooLink url="/" variant="primary" size="md" className="mt-6 block">
            {t("404.homeLink")}
          </VooDooLink>
        </div>
      </section>
    </div>
  )
}

export default FourOFourPage
