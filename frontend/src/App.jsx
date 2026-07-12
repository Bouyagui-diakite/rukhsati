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
import Users from './pages/admin/Users'
import UserEdit from './pages/admin/UserEdit'
import { RequireAuth } from './auth'

const OPERATOR = ['operator', 'admin']
const BACKOFFICE = ['officer', 'director', 'admin']
const INSPECTOR = ['inspector', 'admin']
const ADMIN = ['admin']

const StepIcon = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
)

function Landing() {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'

  const steps = [
    { n: 1, title: t('step1Title'), desc: t('step1Desc'), icon: <StepIcon><path d="M5 4h9l5 5v11H5z" /><path d="M14 4v5h5" /><path d="M9 13h6M9 16h6" /></StepIcon> },
    { n: 2, title: t('step2Title'), desc: t('step2Desc'), icon: <StepIcon><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></StepIcon> },
    { n: 3, title: t('step3Title'), desc: t('step3Desc'), icon: <StepIcon><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" /><path d="M9 12l2 2 4-4" /></StepIcon> },
  ]

  return (
    <div className="rk-landing">
      <header className="rk-lp-header">
        <div className="rk-lp-wrap bar">
          <Link to="/" className="rk-lp-brand">
            <Emblem />
            <b>{t('appName')}</b>
          </Link>
          <nav className="rk-lp-nav">
            <span className="rk-lang">
              <button className={!isRtl ? 'on' : ''} onClick={() => setLanguage('fr')}>FR</button>
              <button className={isRtl ? 'on' : ''} onClick={() => setLanguage('ar')}>ع</button>
            </span>
            <Link to="/connexion" className="rk-btn rk-btn-ghost" style={{ textDecoration: 'none' }}>{t('login')}</Link>
          </nav>
        </div>
      </header>

      <section className="rk-lp-hero">
        <div className="rk-lp-wrap">
          <Emblem className="emblem-lg" />
          <h1>{t('heroTitle')}</h1>
          <p className="sub">{t('heroSubtitle')}</p>
          <div className="cta">
            <Link to="/inscription" className="rk-btn rk-btn-primary" style={{ textDecoration: 'none' }}>{t('heroCtaPrimary')}</Link>
            <Link to="/verifier" className="rk-btn rk-btn-ghost" style={{ textDecoration: 'none' }}>{t('heroCtaSecondary')}</Link>
          </div>
          <p className="signin">{t('alreadyAccount')} <Link to="/connexion">{t('login')}</Link></p>
        </div>
      </section>

      <section className="rk-lp-section">
        <div className="rk-lp-wrap">
          <span className="rk-lp-eyebrow">{t('appName')}</span>
          <h2>{t('howTitle')}</h2>
          <div className="rk-steps">
            {steps.map((s) => (
              <div key={s.n} className="rk-step">
                <span className="n">{s.n}</span>
                <span className="ic">{s.icon}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rk-lp-section" style={{ paddingTop: 0 }}>
        <div className="rk-lp-wrap">
          <div className="rk-verify-banner">
            <div className="txt">
              <h2>{t('verifyBannerTitle')}</h2>
              <p>{t('verifyBannerDesc')}</p>
            </div>
            <svg className="qr-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M20 14v.01M14 20h.01M20 20v-3M17 20h.01" />
            </svg>
            <Link to="/verifier" className="rk-btn" style={{ textDecoration: 'none' }}>{t('heroCtaSecondary')}</Link>
          </div>
        </div>
      </section>

      <section className="rk-lp-section" style={{ paddingTop: 0 }}>
        <div className="rk-lp-wrap">
          <div className="rk-audiences">
            <div className="rk-aud"><b>{t('forOperators')}</b><p>{t('forOperatorsDesc')}</p></div>
            <div className="rk-aud"><b>{t('forMinistry')}</b><p>{t('forMinistryDesc')}</p></div>
          </div>
        </div>
      </section>

      <footer className="rk-lp-foot">
        <div className="rk-lp-wrap">
          {t('country')} · {t('ministry')}
        </div>
      </footer>
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
      <Route
        path="/admin/utilisateurs"
        element={<RequireAuth roles={ADMIN}><Users /></RequireAuth>}
      />
      <Route
        path="/admin/utilisateurs/nouveau"
        element={<RequireAuth roles={ADMIN}><UserEdit /></RequireAuth>}
      />
      <Route
        path="/admin/utilisateurs/:id"
        element={<RequireAuth roles={ADMIN}><UserEdit /></RequireAuth>}
      />
    </Routes>
  )
}
