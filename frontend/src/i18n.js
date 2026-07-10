import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  fr: {
    translation: {
      appName: 'Rukhsati',
      ministry: 'Ministère du Commerce et du Tourisme',
      myApplications: 'Vos dossiers',
      newApplication: 'Nouvelle demande',
      verify: 'Vérifier un agrément',
      login: 'Se connecter',
      register: 'Créer un compte',
    },
  },
  ar: {
    translation: {
      appName: 'رخصتي',
      ministry: 'وزارة التجارة والسياحة',
      myApplications: 'ملفاتك',
      newApplication: 'طلب جديد',
      verify: 'التحقق من رخصة',
      login: 'تسجيل الدخول',
      register: 'إنشاء حساب',
    },
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('lang') || 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
})

export function setLanguage(lang) {
  i18n.changeLanguage(lang)
  localStorage.setItem('lang', lang)
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
}

setLanguage(i18n.language)

export default i18n
