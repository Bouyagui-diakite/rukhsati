import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import api from '../../api'
import AppShell from '../../components/AppShell'
import StatusBadge from '../../components/StatusBadge'

export default function Inspections() {
  const { t, i18n } = useTranslation()
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

  const rows = state.rows ?? []

  return (
    <AppShell variant="inspector" eyebrow={t('appName')} title={t('inspectorTitle')}>
      {state.status === 'loading' && <p style={{ color: 'var(--ink-soft)' }}>{t('loadingApplications')}</p>}
      {state.status === 'error' && <p className="rk-note warn">{t('verifyError')}</p>}
      {state.status === 'ok' && rows.length === 0 && <div className="rk-empty">{t('noInspections')}</div>}

      {state.status === 'ok' && rows.length > 0 && (
        <div className="rk-card">
          {rows.map((app) => (
            <Link key={app.id} to={`/inspecteur/dossiers/${app.id}`} className="rk-row">
              <div className="body">
                <div className="line1"><span className="who">{isRtl ? app.license_type?.name_ar : app.license_type?.name_fr}</span></div>
                <div className="line2">
                  <span className="ref">{app.reference}</span>
                  <span className="sep">·</span>{t('inspScheduledFor')} {fmtDate(app.inspection?.scheduled_for)}
                </div>
              </div>
              <div className="actions"><StatusBadge status={app.status} /></div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  )
}
