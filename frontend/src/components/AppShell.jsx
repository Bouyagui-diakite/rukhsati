import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth'
import { setLanguage } from '../i18n'
import Emblem from './Emblem'

const Icon = ({ d }) => (
  <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    {d}
  </svg>
)

const ICONS = {
  files: <Icon d={<><path d="M5 4h9l5 5v11H5z" /><path d="M14 4v5h5" /></>} />,
  plus: <Icon d={<><path d="M12 5v14M5 12h14" strokeLinecap="round" /></>} />,
  grid: <Icon d={<><path d="M4 5h16M4 12h16M4 19h10" strokeLinecap="round" /></>} />,
  search: <Icon d={<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" strokeLinecap="round" /></>} />,
}

const NAV = {
  operator: (t) => [
    { to: '/operateur', label: t('portalTitle'), icon: ICONS.files, end: true },
    { to: '/operateur/nouveau', label: t('newApplication'), icon: ICONS.plus },
  ],
  backoffice: (t) => [
    { to: '/ministere', label: t('boQueue'), icon: ICONS.grid, end: true },
  ],
  inspector: (t) => [
    { to: '/inspecteur', label: t('inspectorTitle'), icon: ICONS.search, end: true },
  ],
}

const ROLE_LABEL = {
  operator: 'Opérateur', officer: 'Agent de guichet', inspector: 'Inspecteur',
  director: 'Directeur', admin: 'Administrateur',
}

/**
 * Coquille des espaces authentifiés : rail officiel (emblème, navigation par
 * rôle, identité, langue, déconnexion) + en-tête de page + contenu.
 */
export default function AppShell({ variant, eyebrow, title, subtitle, actions, children }) {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isRtl = i18n.language === 'ar'

  const items = (NAV[variant] ?? NAV.operator)(t)
  const initials = (user?.name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  const onLogout = async () => { await logout(); navigate('/', { replace: true }) }

  return (
    <div className="rk-app">
      <aside className="rk-rail">
        <Link to="/" className="rk-brand" style={{ color: '#fff', textDecoration: 'none' }}>
          <Emblem />
          <span><b>Rukhsati</b><span className="rk-brand-ar" dir="rtl" lang="ar">رخصتي</span></span>
        </Link>

        <nav className="rk-nav" aria-label="Navigation">
          {items.map((it) => {
            const active = it.end ? location.pathname === it.to : location.pathname.startsWith(it.to)
            return (
              <Link key={it.to} to={it.to} className={active ? 'active' : ''}>
                {it.icon}{it.label}
              </Link>
            )
          })}
        </nav>

        <div className="rk-rail-spacer" />

        <div className="rk-ministry">
          Ministère du Commerce et du Tourisme
          <span className="ar" dir="rtl" lang="ar">وزارة التجارة والسياحة</span>
        </div>

        <div className="rk-whoami">
          <span className="av">{initials}</span>
          <span className="who"><b>{user?.name}</b><span>{ROLE_LABEL[user?.role] ?? ''}</span></span>
        </div>

        <div className="rk-rail-actions">
          <button type="button" onClick={() => setLanguage(isRtl ? 'fr' : 'ar')}>{isRtl ? 'Français' : 'العربية'}</button>
          <button type="button" onClick={onLogout}>{t('logout')}</button>
        </div>
      </aside>

      <main className="rk-main">
        <div className="rk-topbar">
          <div>
            {eyebrow && <span className="rk-eyebrow">{eyebrow}</span>}
            <h1 className="rk-h1">{title}</h1>
            {subtitle && <span className="rk-sub">{subtitle}</span>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  )
}
