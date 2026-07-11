import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api'
import AppShell from '../../components/AppShell'

export default function NewApplication() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isRtl = i18n.language === 'ar'

  const [types, setTypes] = useState(null)
  const [selected, setSelected] = useState(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    api.get('/license-types')
      .then((res) => { if (!cancelled) setTypes(res.data) })
      .catch(() => { if (!cancelled) setTypes([]) })
    return () => { cancelled = true }
  }, [])

  const fmtFee = (mru) => new Intl.NumberFormat(isRtl ? 'ar-MR' : 'fr-FR').format(mru)

  const create = async () => {
    if (!selected) return
    setError('')
    setCreating(true)
    try {
      const { data } = await api.post('/applications', { license_type_id: selected })
      navigate(`/operateur/dossiers/${data.id}`)
    } catch {
      setError(t('createError'))
      setCreating(false)
    }
  }

  return (
    <AppShell variant="operator" eyebrow={t('newApplication')} title={t('chooseType')}>
      {types === null && <p style={{ color: 'var(--ink-soft)' }}>{t('detailLoading')}</p>}

      {types && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
          {types.map((type) => {
            const active = selected === type.id
            const desc = isRtl ? type.description_ar : type.description_fr
            return (
              <button key={type.id} type="button" onClick={() => setSelected(type.id)} className={`rk-choice ${active ? 'on' : ''}`}>
                <div className="top">
                  <span className="name">{isRtl ? type.name_ar : type.name_fr}</span>
                  <span className="radio" />
                </div>
                {desc && <p className="desc">{desc}</p>}
                <div className="meta">
                  <span>{t('fee')} : <b>{fmtFee(type.fee_mru)} MRU</b></span>
                  <span>{t('validity')} : <b>{type.validity_months} {t('months')}</b></span>
                  <span>{type.required_documents?.length ?? 0} {t('requiredDocsCount')}</span>
                </div>
              </button>
            )
          })}

          {error && <p className="rk-note err">{error}</p>}

          <button onClick={create} disabled={!selected || creating} className="rk-btn rk-btn-primary rk-btn-block" style={{ marginTop: 6 }}>
            {creating ? t('creating') : t('createDraft')}
          </button>
        </div>
      )}
    </AppShell>
  )
}
