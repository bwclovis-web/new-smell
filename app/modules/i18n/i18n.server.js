import i18n from 'i18next'
import Backend from 'i18next-fs-backend'
import { LanguageDetector } from 'i18next-http-middleware'
import path from 'path'
import { initReactI18next } from 'react-i18next'

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'es'],
    load: 'languageOnly',
    interpolation: {
      escapeValue: false // React already does escaping
    },
    backend: {
      loadPath: path.resolve('./public/locales/{{lng}}/{{ns}}.json')
    },
    detection: {
      order: ['cookie', 'header'],
      caches: false
    },
    react: {
      useSuspense: true,
      bindI18n: 'languageChanged'
    }
  })
export default i18n
