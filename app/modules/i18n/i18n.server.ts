import i18n from 'i18next'
import Backend from 'i18next-fs-backend'
import { dirname, resolve } from 'path'
import { initReactI18next } from 'react-i18next'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

if (!i18n.isInitialized) {
  i18n
    .use(Backend)
    .use(initReactI18next)
    .init({
      fallbackLng: 'en',
      supportedLngs: ['en', 'es'],
      load: 'languageOnly',
      debug: process.env.NODE_ENV === 'development',
      defaultNS: 'translation',
      ns: ['translation'],
      interpolation: {
        escapeValue: false // React already does escaping
      },
      backend: {
        loadPath: resolve(__dirname, '../../../public/locales/{{lng}}/{{ns}}.json'),
      },
      react: {
        useSuspense: false, // Disable Suspense for SSR to prevent hydration issues
        bindI18n: 'loaded'
      },
      initImmediate: false, // Important for server-side
    })
}

export default i18n
