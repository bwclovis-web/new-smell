import i18n from "i18next"
import Backend from "i18next-fs-backend"
import { resolve } from "path"
import { initReactI18next } from "react-i18next"

// This .js file is used by the local dev Express server (api/server.js)
// where the filesystem is available. Use process.cwd() for reliable path
// resolution instead of __dirname (which breaks after build).
if (!i18n.isInitialized) {
  i18n
    .use(Backend)
    .use(initReactI18next)
    .init({
      fallbackLng: "en",
      supportedLngs: ["en", "es"],
      load: "languageOnly",
      debug: false, // Disabled for faster startup - enable only when debugging i18n
      interpolation: {
        escapeValue: false, // React already does escaping
      },
      backend: {
        loadPath: resolve(process.cwd(), "public/locales/{{lng}}/{{ns}}.json"),
      },
      react: {
        useSuspense: false, // Disable Suspense for SSR to prevent hydration issues
      },
    })
}

export default i18n
