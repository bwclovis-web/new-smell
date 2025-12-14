import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import Backend from "i18next-http-backend"
import { initReactI18next } from "react-i18next"

// Prevent re-initialization during HMR
if (!i18n.isInitialized) {
  i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: "en",
      supportedLngs: ["en", "es"],
      debug: import.meta.env.DEV && !import.meta.hot, // Disable debug during HMR
      load: "languageOnly",
      defaultNS: "translation",
      ns: ["translation"],
      interpolation: {
        escapeValue: false, // React already does escaping
      },
      backend: {
        loadPath: "/locales/{{lng}}/{{ns}}.json",
      },
      react: {
        useSuspense: false, // Match server configuration to prevent hydration issues
        // Bind to both loaded and languageChanged events so components re-render on language changes
        bindI18n: "loaded languageChanged",
      },
      detection: {
        order: [
"cookie", "localStorage", "navigator", "htmlTag"
],
        caches: ["localStorage", "cookie"],
        // Prevent multiple language detections during HMR
        lookupLocalStorage: "i18nextLng",
        lookupCookie: "i18next",
        // Only detect once, not on every render
        checkWhitelist: true,
        // Persist language choice to prevent re-detection
        cookieMinutes: 525600, // 1 year - persist language choice
      },
    })
}

// Prevent language changes during HMR updates
if (import.meta.hot) {
  import.meta.hot.on("vite:beforeUpdate", () => {
    // Suppress language change events during HMR
    i18n.off("languageChanged")
  })
  
  import.meta.hot.on("vite:afterUpdate", () => {
    // Re-enable language change events after HMR
    // This is handled by react-i18next bindI18n
  })
}

export default i18n
