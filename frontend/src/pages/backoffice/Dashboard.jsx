import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import api from '../../api'
import { useAuth } from '../../auth'
import AppShell from '../../components/AppShell'
import StatusBadge from '../../components/StatusBadge'

const FILTERS = [
  'submitted', 'under_review', 'awaiting_documents',
  'technical_review', 'inspection', 'awaiting_decision', 'approved', 'rejected',
]

const BAR_COLORS = ['var(--green-700)', 'var(--gold)', 'var(--info)', 'var(--green-600)']

function ByType({ title, data, isRtl }) {
  const rows = data ?? []
  if (rows.length === 0) return null
  const max = Math.max(...rows.map((r) => r.total))
  return (
    <div className="rk-card" style={{ marginTop: 18 }}>
      <div className="rk-card-h"><h2>{title}</h2></div>
      <div className="rk-card-b rk-bars">
        {rows.map((row, i) => (
          <div key={row.name_fr} className="rk-bar">
            <span className="bl" title={isRtl ? row.name_ar : row.name_fr}>{isRtl ? row.name_ar : row.name_fr}</span>
            <span className="bv">{row.total}</span>
            <span className="track"><i style={{ width: `${Math.max((row.total / max) * 100, 6)}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} /></span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const isRtl = i18n.language === 'ar'
  const isDirector = ['director', 'admin'].includes(user?.role)

  const [stats, setStats] = useState(null)
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [queue, setQueue] = useState({ status: 'loading' })

  const fmtDate = useCallback(
    (v) => new Date(v).toLocaleDateString(isRtl ? 'ar-MR' : 'fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
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

  const pageData = queue.page
  const rows = pageData?.data ?? []
  const totalActive = stats?.by_status
    ? Object.entries(stats.by_status).filter(([s]) => !['approved', 'rejected'].includes(s)).reduce((n, [, v]) => n + v, 0)
    : '—'
  const today = new Date().toLocaleDateString(isRtl ? 'ar-MR' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <AppShell
      variant="backoffice"
      eyebrow={t('ministryEyebrow')}
      title={isDirector ? t('boDirTitle') : t('boAgentTitle')}
      subtitle={today.charAt(0).toUpperCase() + today.slice(1)}
    >
      {/* Résumé sobre : trois chiffres */}
      <section className="rk-summary">
        <div className="rk-stat"><div className="v">{totalActive}</div><div className="l">{t('statActive')}</div></div>
        <div className="rk-stat"><div className="v"><em>{stats?.pending_decision ?? '—'}</em></div><div className="l">{t('statPending')}</div></div>
        <div className="rk-stat"><div className="v">{stats?.avg_processing_days ?? '—'}<span className="u"> j</span></div><div className="l">{t('statAvg')}</div></div>
      </section>

      <div className="rk-section-h">
        <h2>{t('boQueue')}</h2>
      </div>

      <div className="rk-filters">
        <button className={`rk-pill ${filter === '' ? 'on' : ''}`} onClick={() => { setFilter(''); setPage(1) }}>{t('filterAll')}</button>
        {FILTERS.map((s) => (
          <button key={s} className={`rk-pill ${filter === s ? 'on' : ''}`} onClick={() => { setFilter(s); setPage(1) }}>{t(`st_${s}`)}</button>
        ))}
      </div>

      {queue.status === 'loading' && <p style={{ color: 'var(--ink-soft)' }}>{t('loadingApplications')}</p>}
      {queue.status === 'error' && <p className="rk-note warn">{t('verifyError')}</p>}
      {queue.status === 'ok' && rows.length === 0 && <div className="rk-empty">{t('emptyApplications')}</div>}

      {queue.status === 'ok' && rows.length > 0 && (
        <div className="rk-card">
          {rows.map((app) => (
            <Link key={app.id} to={`/ministere/dossiers/${app.id}`} className="rk-row">
              <div className="body">
                <div className="line1"><span className="who">{app.user?.name ?? app.reference}</span></div>
                <div className="line2">
                  <span className="ref">{app.reference}</span>
                  <span className="sep">·</span>
                  {isRtl ? app.license_type?.name_ar : app.license_type?.name_fr}
                  <span className="sep">·</span>{fmtDate(app.created_at)}
                </div>
              </div>
              <div className="actions"><StatusBadge status={app.status} /></div>
            </Link>
          ))}
        </div>
      )}

      {queue.status === 'ok' && pageData?.last_page > 1 && (
        <div className="rk-pager">
          <button disabled={pageData.current_page <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
          <span className="pg">{pageData.current_page} / {pageData.last_page}</span>
          <button disabled={pageData.current_page >= pageData.last_page} onClick={() => setPage((p) => p + 1)}>›</button>
        </div>
      )}

      <ByType title={t('statsByType')} data={stats?.by_type} isRtl={isRtl} />
    </AppShell>
  )
}
