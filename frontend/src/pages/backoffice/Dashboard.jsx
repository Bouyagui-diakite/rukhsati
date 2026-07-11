import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../api'
import { useAuth } from '../../auth'
import { setLanguage } from '../../i18n'
import StatusBadge from '../../components/StatusBadge'

const FILTERS = [
  'submitted', 'under_review', 'awaiting_documents',
  'technical_review', 'inspection', 'awaiting_decision', 'approved', 'rejected',
]

function StatTile({ label, value }) {
  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-200 p-4">
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

/** Répartition des dossiers par type d'agrément, en barres horizontales. */
function ByTypeChart({ title, data, isRtl }) {
  const rows = data ?? []
  if (rows.length === 0) return null

  const max = Math.max(...rows.map((r) => r.total))

  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-200 p-4 mb-8">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">{title}</h2>
      <div className="flex flex-col gap-2.5">
        {rows.map((row) => {
          const label = isRtl ? row.name_ar : row.name_fr
          return (
            <div key={row.name_fr} className="flex items-center gap-3">
              <span className="w-40 shrink-0 text-sm text-gray-600 truncate" title={label}>{label}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max((row.total / max) * 100, 6)}%`, background: 'var(--rk-green)' }}
                />
              </div>
              <span className="w-6 shrink-0 text-sm font-semibold text-gray-800 text-end">{row.total}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isRtl = i18n.language === 'ar'

  const [stats, setStats] = useState(null)
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [queue, setQueue] = useState({ status: 'loading' })

  const fmtDate = useCallback(
    (value) => new Date(value).toLocaleDateString(isRtl ? 'ar-MR' : 'fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }),
    [isRtl],
  )

  useEffect(() => {
    api.get('/backoffice/stats').then((res) => setStats(res.data)).catch(() => setStats(null))
  }, [])

  useEffect(() => {
    let cancelled = false
    setQueue({ status: 'loading' })
    const params = { page }
    if (filter) params.status = filter
    api.get('/applications', { params })
      .then((res) => { if (!cancelled) setQueue({ status: 'ok', page: res.data }) })
      .catch(() => { if (!cancelled) setQueue({ status: 'error' }) })
    return () => { cancelled = true }
  }, [filter, page])

  const onLogout = async () => { await logout(); navigate('/', { replace: true }) }

  const pageData = queue.page
  const rows = pageData?.data ?? []
  const totalActive = stats?.by_status
    ? Object.entries(stats.by_status)
      .filter(([s]) => !['approved', 'rejected'].includes(s))
      .reduce((sum, [, n]) => sum + n, 0)
    : '—'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="text-white" style={{ background: 'var(--rk-green)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold leading-tight">{t('appName')} · {t('boTitle')}</p>
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

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatTile label={t('statActive')} value={totalActive} />
          <StatTile label={t('statPending')} value={stats?.pending_decision ?? '—'} />
          <StatTile label={t('statLicenses')} value={stats?.licenses_issued ?? '—'} />
          <StatTile label={t('statAvg')} value={stats?.avg_processing_days ?? '—'} />
        </div>

        <ByTypeChart title={t('statsByType')} data={stats?.by_type} isRtl={isRtl} />

        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('boQueue')}</h2>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          <button
            onClick={() => { setFilter(''); setPage(1) }}
            className={`shrink-0 text-sm rounded-full px-3 py-1 ring-1 ${filter === '' ? 'bg-emerald-600 text-white ring-emerald-600' : 'bg-white text-gray-600 ring-gray-200'}`}
          >
            {t('filterAll')}
          </button>
          {FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => { setFilter(s); setPage(1) }}
              className={`shrink-0 text-sm rounded-full px-3 py-1 ring-1 ${filter === s ? 'bg-emerald-600 text-white ring-emerald-600' : 'bg-white text-gray-600 ring-gray-200'}`}
            >
              {t(`st_${s}`)}
            </button>
          ))}
        </div>

        {queue.status === 'loading' && <p className="text-gray-500">{t('loadingApplications')}</p>}
        {queue.status === 'error' && (
          <p className="rounded-lg bg-amber-50 ring-1 ring-amber-600/20 p-4 text-amber-700">{t('verifyError')}</p>
        )}
        {queue.status === 'ok' && rows.length === 0 && (
          <div className="rounded-xl bg-white ring-1 ring-gray-200 p-10 text-center text-gray-500">
            {t('emptyApplications')}
          </div>
        )}

        {queue.status === 'ok' && rows.length > 0 && (
          <div className="bg-white rounded-xl ring-1 ring-gray-200 divide-y divide-gray-100">
            {rows.map((app) => (
              <Link
                key={app.id}
                to={`/ministere/dossiers/${app.id}`}
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

        {queue.status === 'ok' && pageData?.last_page > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button className="text-sm px-3 py-1 rounded-lg border disabled:opacity-40"
              disabled={pageData.current_page <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
            <span className="text-sm text-gray-500">{pageData.current_page} / {pageData.last_page}</span>
            <button className="text-sm px-3 py-1 rounded-lg border disabled:opacity-40"
              disabled={pageData.current_page >= pageData.last_page} onClick={() => setPage((p) => p + 1)}>›</button>
          </div>
        )}
      </main>
    </div>
  )
}
