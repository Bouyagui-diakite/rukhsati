import { Routes, Route, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { setLanguage } from './i18n'
import Verify from './pages/Verify'
import Login from './pages/Login'
import Applications from './pages/operator/Applications'
import ApplicationDetail from './pages/operator/ApplicationDetail'
import NewApplication from './pages/operator/NewApplication'
import Dashboard from './pages/backoffice/Dashboard'
import ApplicationReview from './pages/backoffice/ApplicationReview'
import Inspections from './pages/inspector/Inspections'
import InspectionReport from './pages/inspector/InspectionReport'
import { RequireAuth } from './auth'

const OPERATOR = ['operator', 'admin']
const BACKOFFICE = ['officer', 'director', 'admin']
const INSPECTOR = ['inspector', 'admin']

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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/connexion" element={<Login />} />
      <Route path="/verifier/:token?" element={<Verify />} />
      <Route
        path="/operateur"
        element={<RequireAuth roles={OPERATOR}><Applications /></RequireAuth>}
      />
      <Route
        path="/operateur/nouveau"
        element={<RequireAuth roles={OPERATOR}><NewApplication /></RequireAuth>}
      />
      <Route
        path="/operateur/dossiers/:id"
        element={<RequireAuth roles={OPERATOR}><ApplicationDetail /></RequireAuth>}
      />
      <Route
        path="/ministere"
        element={<RequireAuth roles={BACKOFFICE}><Dashboard /></RequireAuth>}
      />
      <Route
        path="/ministere/dossiers/:id"
        element={<RequireAuth roles={BACKOFFICE}><ApplicationReview /></RequireAuth>}
      />
      <Route
        path="/inspecteur"
        element={<RequireAuth roles={INSPECTOR}><Inspections /></RequireAuth>}
      />
      <Route
        path="/inspecteur/dossiers/:id"
        element={<RequireAuth roles={INSPECTOR}><InspectionReport /></RequireAuth>}
      />
    </Routes>
  )
}
