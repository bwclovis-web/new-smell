import i18n from 'i18next';
import Backend from 'i18next-fs-backend';
import { initReactI18next } from 'react-i18next';
import path from 'path';

if (!i18n.isInitialized) {
  i18n
    .use(Backend)
    .use(initReactI18next)
    .init({
      fallbackLng: 'en',
      debug: process.env.NODE_ENV === 'development',
      backend: {
        loadPath: path.resolve(__dirname, '../../public/locales/{{lng}}/{{ns}}.json'),
      },
      react: {
        useSuspense: false, // Disable Suspense for SSR
      },
    });
}

export default i18n;
