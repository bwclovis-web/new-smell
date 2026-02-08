import i18n from "i18next"
import { initReactI18next } from "react-i18next"

// Import translations directly so they are bundled into the server code.
// Using i18next-fs-backend with __dirname-relative paths does NOT work on
// serverless platforms (Vercel) because the locale files live on the CDN,
// not on the function's filesystem.
import en from "../../../public/locales/en/translation.json"
import es from "../../../public/locales/es/translation.json"

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      fallbackLng: "en",
      supportedLngs: ["en", "es"],
      load: "languageOnly",
      debug: process.env.NODE_ENV === "development",
      defaultNS: "translation",
      ns: ["translation"],
      interpolation: {
        escapeValue: false, // React already does escaping
      },
      resources: {
        en: { translation: en },
        es: { translation: es },
      },
      react: {
        useSuspense: false, // Disable Suspense for SSR to prevent hydration issues
        bindI18n: "loaded",
      },
      initImmediate: false, // Important for server-side
    })
}

export default i18n
