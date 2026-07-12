import { Routes, Route, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { setLanguage } from './i18n'
import Emblem from './components/Emblem'
import Verify from './pages/Verify'
import Login from './pages/Login'
import Register from './pages/Register'
import Applications from './pages/operator/Applications'
import ApplicationDetail from './pages/operator/ApplicationDetail'
import NewApplication from './pages/operator/NewApplication'
import Dashboard from './pages/backoffice/Dashboard'
import ApplicationReview from './pages/backoffice/ApplicationReview'
import Inspections from './pages/inspector/Inspections'
import InspectionReport from './pages/inspector/InspectionReport'
import LicenseTypes from './pages/admin/LicenseTypes'
import LicenseTypeEdit from './pages/admin/LicenseTypeEdit'
import { RequireAuth } from './auth'

const OPERATOR = ['operator', 'admin']
const BACKOFFICE = ['officer', 'director', 'admin']
const INSPECTOR = ['inspector', 'admin']
const ADMIN = ['admin']

function Landing() {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'
  return (
    <div className="rk-landing">
      <div className="rk-landing-top">
        <span className="rk-lang">
          <button className={!isRtl ? 'on' : ''} onClick={() => setLanguage('fr')}>FR</button>
          <button className={isRtl ? 'on' : ''} onClick={() => setLanguage('ar')}>ع</button>
        </span>
      </div>

      <div className="rk-landing-hero">
        <Emblem className="rk-emblem" />
        <h1>{t('appName')}</h1>
        <span className="ar" dir="rtl" lang="ar">رخصتي</span>
        <p className="tagline">{t('ministry')}</p>

        <nav className="rk-landing-cta">
          <Link to="/connexion" className="rk-btn rk-btn-primary rk-btn-block" style={{ textDecoration: 'none', padding: '12px' }}>
            {t('login')}
          </Link>
          <Link to="/inscription" className="rk-btn rk-btn-ghost rk-btn-block" style={{ textDecoration: 'none', padding: '12px' }}>
            {t('createAccount')}
          </Link>
          <Link to="/verifier" style={{ textAlign: 'center', fontSize: '.86rem', color: 'var(--ink-soft)', marginTop: 4 }}>
            {t('verify')}
          </Link>
        </nav>
      </div>

      <div className="rk-landing-foot">
        Ministère du Commerce et du Tourisme · <span dir="rtl" lang="ar">وزارة التجارة والسياحة</span>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/connexion" element={<Login />} />
      <Route path="/inscription" element={<Register />} />
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
      <Route
        path="/admin"
        element={<RequireAuth roles={ADMIN}><LicenseTypes /></RequireAuth>}
      />
      <Route
        path="/admin/types/nouveau"
        element={<RequireAuth roles={ADMIN}><LicenseTypeEdit /></RequireAuth>}
      />
      <Route
        path="/admin/types/:id"
        element={<RequireAuth roles={ADMIN}><LicenseTypeEdit /></RequireAuth>}
      />
    </Routes>
  )
}
