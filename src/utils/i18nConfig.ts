import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import frTranslations from '../locales/fr.json';
import enTranslations from '../locales/en.json';

const resources = {
  fr: frTranslations,
  en: enTranslations,
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    defaultNS: 'common',
    interpolation: {
      // React échappe déjà le JSX par défaut (protection XSS)
      // Garde false car React gère l'échappement via JSX
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
