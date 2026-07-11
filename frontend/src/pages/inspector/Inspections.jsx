import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../api'
import { useAuth } from '../../auth'
import { setLanguage } from '../../i18n'
import StatusBadge from '../../components/StatusBadge'

export default function Inspections() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isRtl = i18n.language === 'ar'

  const [state, setState] = useState({ status: 'loading' })

  const fmtDate = useCallback(
    (v) => v && new Date(v).toLocaleDateString(isRtl ? 'ar-MR' : 'fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    [isRtl],
  )

  useEffect(() => {
    let cancelled = false
    api.get('/inspector/inspections')
      .then((res) => { if (!cancelled) setState({ status: 'ok', rows: res.data }) })
      .catch(() => { if (!cancelled) setState({ status: 'error' }) })
    return () => { cancelled = true }
  }, [])

  const onLogout = async () => { await logout(); navigate('/', { replace: true }) }
  const rows = state.rows ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="text-white" style={{ background: 'var(--rk-green)' }}>
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold leading-tight">{t('appName')} · {t('inspectorTitle')}</p>
            <p className="text-xs text-white/80">{user?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-sm border border-white/40 rounded-full px-3 py-1 hover:bg-white/10"
              onClick={() => setLanguage(isRtl ? 'fr' : 'ar')}>
              {isRtl ? 'Français' : 'العربية'}
            </button>
            <button className="text-sm bg-white/15 rounded-full px-3 py-1 hover:bg-white/25" onClick={onLogout}>
              {t('logout')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-5">{t('inspectorTitle')}</h1>

        {state.status === 'loading' && <p className="text-gray-500">{t('loadingApplications')}</p>}
        {state.status === 'error' && (
          <p className="rounded-lg bg-amber-50 ring-1 ring-amber-600/20 p-4 text-amber-700">{t('verifyError')}</p>
        )}
        {state.status === 'ok' && rows.length === 0 && (
          <div className="rounded-xl bg-white ring-1 ring-gray-200 p-10 text-center text-gray-500">
            {t('noInspections')}
          </div>
        )}

        {state.status === 'ok' && rows.length > 0 && (
          <div className="bg-white rounded-xl ring-1 ring-gray-200 divide-y divide-gray-100">
            {rows.map((app) => (
              <Link key={app.id} to={`/inspecteur/dossiers/${app.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="min-w-0">
                  <p className="font-mono text-sm text-gray-900">{app.reference}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {isRtl ? app.license_type?.name_ar : app.license_type?.name_fr}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <StatusBadge status={app.status} />
                  <span className="text-xs text-gray-400">{t('inspScheduledFor')} {fmtDate(app.inspection?.scheduled_for)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
