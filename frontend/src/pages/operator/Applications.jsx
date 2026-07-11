import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import api from '../../api'
import AppShell from '../../components/AppShell'
import StatusBadge from '../../components/StatusBadge'

export default function Applications() {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'

  const [page, setPage] = useState(1)
  const [state, setState] = useState({ status: 'loading' })

  const fmtDate = useCallback(
    (v) => new Date(v).toLocaleDateString(isRtl ? 'ar-MR' : 'fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    [isRtl],
  )

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    api.get('/applications', { params: { page } })
      .then((res) => { if (!cancelled) setState({ status: 'ok', page: res.data }) })
      .catch(() => { if (!cancelled) setState({ status: 'error' }) })
    return () => { cancelled = true }
  }, [page])

  const pageData = state.page
  const rows = pageData?.data ?? []

  const newBtn = (
    <Link to="/operateur/nouveau" className="rk-btn rk-btn-primary" style={{ textDecoration: 'none' }}>
      + {t('newApplication')}
    </Link>
  )

  return (
    <AppShell variant="operator" eyebrow={t('appName')} title={t('portalTitle')} actions={newBtn}>
      {state.status === 'loading' && <p style={{ color: 'var(--ink-soft)' }}>{t('loadingApplications')}</p>}
      {state.status === 'error' && <p className="rk-note warn">{t('verifyError')}</p>}
      {state.status === 'ok' && rows.length === 0 && <div className="rk-empty">{t('emptyApplications')}</div>}

      {state.status === 'ok' && rows.length > 0 && (
        <div className="rk-card">
          {rows.map((app) => (
            <Link key={app.id} to={`/operateur/dossiers/${app.id}`} className="rk-row">
              <div className="body">
                <div className="line1">
                  <span className="who">{isRtl ? app.license_type?.name_ar : app.license_type?.name_fr}</span>
                </div>
                <div className="line2"><span className="ref">{app.reference}</span><span className="sep">·</span>{fmtDate(app.created_at)}</div>
              </div>
              <div className="actions"><StatusBadge status={app.status} /></div>
            </Link>
          ))}
        </div>
      )}

      {state.status === 'ok' && pageData?.last_page > 1 && (
        <div className="rk-pager">
          <button disabled={pageData.current_page <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
          <span className="pg">{pageData.current_page} / {pageData.last_page}</span>
          <button disabled={pageData.current_page >= pageData.last_page} onClick={() => setPage((p) => p + 1)}>›</button>
        </div>
      )}
    </AppShell>
  )
}
