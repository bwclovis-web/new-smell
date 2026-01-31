import i18n from "i18next"
import Backend from "i18next-http-backend"
import { initReactI18next } from "react-i18next"

// Prevent re-initialization during HMR
if (!i18n.isInitialized) {
  // Initialize with Backend (needed for translations) but lazy load LanguageDetector
  i18n
    .use(Backend)
    .use(initReactI18next)
    .init({
      fallbackLng: "en",
      supportedLngs: ["en", "es"],
      debug: false,
      load: "languageOnly",
      defaultNS: "translation",
      ns: ["translation"],
      interpolation: {
        escapeValue: false,
      },
      backend: {
        loadPath: "/locales/{{lng}}/{{ns}}.json",
        reloadInterval: false,
      },
      react: {
        useSuspense: false,
        bindI18n: "loaded languageChanged",
      },
      initImmediate: false,
      // Use fallback language initially, detector will update when loaded
      lng: "en",
    })

  // Lazy load LanguageDetector after initial render for performance
  // This is safe because we default to 'en' above
  if (typeof window !== "undefined") {
    requestIdleCallback(
      async () => {
        const { default: LanguageDetector } = await import("i18next-browser-languagedetector")

        i18n.use(LanguageDetector)

        // Configure detection
        i18n.options.detection = {
          order: ["cookie", "localStorage", "navigator", "htmlTag"],
          caches: ["localStorage", "cookie"],
          lookupLocalStorage: "i18nextLng",
          lookupCookie: "i18next",
          checkWhitelist: true,
          cookieMinutes: 525600,
        }

        // Detect and change language if needed
        const detectedLng = i18n.services.languageDetector?.detect()
        if (detectedLng && detectedLng !== i18n.language) {
          await i18n.changeLanguage(detectedLng)
        }
      },
      { timeout: 2000 }
    )
  }
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
