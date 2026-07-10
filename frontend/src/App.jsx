import { Routes, Route, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { setLanguage } from './i18n'

function Landing() {
  const { t, i18n } = useTranslation()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-50 px-4">
      <button
        className="self-end text-sm border rounded-full px-4 py-1 text-gray-600"
        onClick={() => setLanguage(i18n.language === 'fr' ? 'ar' : 'fr')}
      >
        {i18n.language === 'fr' ? 'العربية' : 'Français'}
      </button>
      <h1 className="text-4xl font-semibold" style={{ color: 'var(--rk-green)' }}>
        {t('appName')}
      </h1>
      <p className="text-gray-600 text-center">{t('ministry')}</p>
      <nav className="flex flex-col gap-3 w-full max-w-xs">
        <Link to="/connexion" className="text-center text-white rounded-lg py-3" style={{ background: 'var(--rk-green)' }}>
          {t('login')}
        </Link>
        <Link to="/verifier" className="text-center border rounded-lg py-3 text-gray-700">
          {t('verify')}
        </Link>
      </nav>
    </div>
  )
}

function Placeholder({ title }) {
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      {title} — en construction
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/connexion" element={<Placeholder title="Connexion" />} />
      <Route path="/verifier/:token?" element={<Placeholder title="Vérification d'agrément" />} />
      <Route path="/operateur/*" element={<Placeholder title="Portail opérateur" />} />
      <Route path="/ministere/*" element={<Placeholder title="Back-office ministère" />} />
    </Routes>
  )
}
