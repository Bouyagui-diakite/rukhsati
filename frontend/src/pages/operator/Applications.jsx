import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../api'
import { useAuth } from '../../auth'
import { setLanguage } from '../../i18n'
import StatusBadge from '../../components/StatusBadge'

export default function Applications() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isRtl = i18n.language === 'ar'

  const [page, setPage] = useState(1)
  const [state, setState] = useState({ status: 'loading' }) // loading | ok | error

  const fmtDate = useCallback(
    (value) => new Date(value).toLocaleDateString(isRtl ? 'ar-MR' : 'fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }),
    [isRtl],
  )

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })

    api
      .get('/applications', { params: { page } })
      .then((res) => { if (!cancelled) setState({ status: 'ok', page: res.data }) })
      .catch(() => { if (!cancelled) setState({ status: 'error' }) })

    return () => { cancelled = true }
  }, [page])

  const onLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  const pageData = state.page
  const rows = pageData?.data ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="text-white" style={{ background: 'var(--rk-green)' }}>
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold leading-tight">{t('appName')}</p>
            <p className="text-xs text-white/80">{user?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="text-sm border border-white/40 rounded-full px-3 py-1 hover:bg-white/10"
              onClick={() => setLanguage(isRtl ? 'fr' : 'ar')}
            >
              {isRtl ? 'Français' : 'العربية'}
            </button>
            <button
              className="text-sm bg-white/15 rounded-full px-3 py-1 hover:bg-white/25"
              onClick={onLogout}
            >
              {t('logout')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-semibold text-gray-900">{t('portalTitle')}</h1>
          <Link
            to="/operateur/nouveau"
            className="rounded-lg px-4 py-2 text-white text-sm font-medium"
            style={{ background: 'var(--rk-green)' }}
          >
            + {t('newApplication')}
          </Link>
        </div>

        {state.status === 'loading' && (
          <p className="text-gray-500">{t('loadingApplications')}</p>
        )}

        {state.status === 'error' && (
          <p className="rounded-lg bg-amber-50 ring-1 ring-amber-600/20 p-4 text-amber-700">
            {t('verifyError')}
          </p>
        )}

        {state.status === 'ok' && rows.length === 0 && (
          <div className="rounded-xl bg-white ring-1 ring-gray-200 p-10 text-center text-gray-500">
            {t('emptyApplications')}
          </div>
        )}

        {state.status === 'ok' && rows.length > 0 && (
          <div className="bg-white rounded-xl ring-1 ring-gray-200 divide-y divide-gray-100">
            {rows.map((app) => (
              <Link
                key={app.id}
                to={`/operateur/dossiers/${app.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm text-gray-900">{app.reference}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {isRtl ? app.license_type?.name_ar : app.license_type?.name_fr}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <StatusBadge status={app.status} />
                  <span className="text-xs text-gray-400">{fmtDate(app.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {state.status === 'ok' && pageData?.last_page > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              className="text-sm px-3 py-1 rounded-lg border disabled:opacity-40"
              disabled={pageData.current_page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ‹
            </button>
            <span className="text-sm text-gray-500">
              {pageData.current_page} / {pageData.last_page}
            </span>
            <button
              className="text-sm px-3 py-1 rounded-lg border disabled:opacity-40"
              disabled={pageData.current_page >= pageData.last_page}
              onClick={() => setPage((p) => p + 1)}
            >
              ›
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
