import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'

if (!i18n.isInitialized) {
  i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: 'en',
      supportedLngs: ['en', 'es'],
      debug: import.meta.env.DEV,
      load: 'languageOnly',
      defaultNS: 'translation',
      ns: ['translation'],
      interpolation: {
        escapeValue: false // React already does escaping
      },
      backend: {
        loadPath: '/locales/{{lng}}/{{ns}}.json'
      },
      react: {
        useSuspense: false, // Match server configuration to prevent hydration issues
        bindI18n: 'languageChanged loaded'
      },
      detection: {
        order: [
          'cookie', 'localStorage', 'navigator', 'htmlTag'
        ],
        caches: ['localStorage', 'cookie']
      }
    })
}

export default i18n
