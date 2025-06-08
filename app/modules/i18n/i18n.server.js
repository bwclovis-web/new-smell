import i18n from 'i18next'
import Backend from 'i18next-fs-backend'
import { LanguageDetector } from 'i18next-http-middleware'
import path from 'path'
import { initReactI18next } from 'react-i18next'
import fs from 'node:fs' // Use node:fs directly instead of dynamic import

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
      loadPath: path.resolve('./public/locales/{{lng}}/{{ns}}.json'),
      // Add fs instance to avoid dynamic import
      readFile: (filename, callback) => {
        fs.readFile(filename, 'utf8', callback)
      },
      writeFile: (filename, data, callback) => {
        fs.writeFile(filename, data, 'utf8', callback)
      }
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
