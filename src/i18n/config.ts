import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import de_translation from './de/translation.json'
import en_translation from './en/translation.json'

void i18next.use(initReactI18next).init({
  lng: 'de',
  debug: true,
  resources: {
    de: {
      translation: de_translation,
    },
    en: {
      translation: en_translation,
    },
  },
})
export default i18next
