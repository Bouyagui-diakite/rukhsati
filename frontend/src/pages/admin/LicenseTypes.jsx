import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import api from '../../api'
import AppShell from '../../components/AppShell'

export default function LicenseTypes() {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'

  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    api.get('/admin/license-types')
      .then((res) => { if (!cancelled) setState({ status: 'ok', rows: res.data }) })
      .catch(() => { if (!cancelled) setState({ status: 'error' }) })
    return () => { cancelled = true }
  }, [])

  const rows = state.rows ?? []
  const fmtFee = (m) => new Intl.NumberFormat(isRtl ? 'ar-MR' : 'fr-FR').format(m)

  const newBtn = (
    <Link to="/admin/types/nouveau" className="rk-btn rk-btn-primary" style={{ textDecoration: 'none' }}>
      + {t('newType')}
    </Link>
  )

  return (
    <AppShell variant="admin" eyebrow={t('adminEyebrow')} title={t('adminTypesTitle')} actions={newBtn}>
      {state.status === 'loading' && <p style={{ color: 'var(--ink-soft)' }}>{t('detailLoading')}</p>}
      {state.status === 'error' && <p className="rk-note warn">{t('verifyError')}</p>}

      {state.status === 'ok' && (
        <div className="rk-card">
          {rows.map((type) => (
            <Link key={type.id} to={`/admin/types/${type.id}`} className="rk-row">
              <div className="body">
                <div className="line1">
                  <span className="who">{isRtl ? type.name_ar : type.name_fr}</span>
                  <span className={`rk-state ${type.active ? 'on' : 'off'}`}>{type.active ? t('typeActive') : t('typeInactive')}</span>
                  {type.requires_inspection && <span className="rk-flag due"><span className="dot" />{t('requiresInspectionShort')}</span>}
                </div>
                <div className="line2">
                  <span className="ref">{type.code}</span>
                  <span className="sep">·</span>{fmtFee(type.fee_mru)} MRU
                  <span className="sep">·</span>{type.validity_months} {t('months')}
                  <span className="sep">·</span>{type.required_documents?.length ?? 0} {t('requiredDocsCount')}
                  <span className="sep">·</span>{type.applications_count} {t('inUseCount')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  )
}
