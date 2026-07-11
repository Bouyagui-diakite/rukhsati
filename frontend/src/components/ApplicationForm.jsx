import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api'

const FULL_WIDTH = ['address', 'activity']

/**
 * Formulaire de renseignements d'une demande, rendu à partir du schéma
 * exposé par l'API (`/application-fields`) — piloté par la config, aucun champ
 * codé en dur. En mode édition : saisie + enregistrement (PATCH). Sinon :
 * restitution en lecture seule des valeurs de `form_data`.
 */
export default function ApplicationForm({ applicationId, initial, editable, onSaved }) {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'

  const [fields, setFields] = useState(null)
  const [values, setValues] = useState(initial ?? {})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get('/application-fields').then((res) => setFields(res.data)).catch(() => setFields([]))
  }, [])

  const label = (f) => (isRtl ? f.label_ar : f.label_fr)
  const optionLabel = (f, value) => {
    const opt = f.options?.find((o) => o.value === value)
    return opt ? (isRtl ? opt.ar : opt.fr) : value
  }

  const setValue = (key, v) => { setValues((prev) => ({ ...prev, [key]: v })); setSaved(false) }

  const save = async () => {
    setError('')
    setSaving(true)
    try {
      await api.patch(`/applications/${applicationId}`, { form_data: values })
      setSaved(true)
      onSaved?.(values)
    } catch (err) {
      setError(err.response?.data?.message ?? t('actionError'))
    } finally {
      setSaving(false)
    }
  }

  if (fields === null) return <p style={{ color: 'var(--ink-soft)' }}>{t('detailLoading')}</p>

  // Lecture seule
  if (!editable) {
    return (
      <dl className="rk-info">
        {fields.map((f) => {
          const raw = values[f.key]
          const shown = f.type === 'select' ? optionLabel(f, raw) : raw
          return (
            <div key={f.key} className={FULL_WIDTH.includes(f.key) ? 'full' : ''}>
              <dt>{label(f)}</dt>
              {shown ? <dd>{shown}</dd> : <dd className="empty">{t('notProvided')}</dd>}
            </div>
          )
        })}
      </dl>
    )
  }

  // Édition
  return (
    <div>
      <div className="rk-form-grid">
        {fields.map((f) => {
          const full = FULL_WIDTH.includes(f.key) || f.type === 'textarea'
          const val = values[f.key] ?? ''
          return (
            <div key={f.key} className={`rk-field ${full ? 'full' : ''}`}>
              <label className="rk-label" htmlFor={`f-${f.key}`}>
                {label(f)}{!f.required && <span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}> · {t('optionalField')}</span>}
              </label>
              {f.type === 'select' ? (
                <select id={`f-${f.key}`} className="rk-select" value={val} onChange={(e) => setValue(f.key, e.target.value)}>
                  <option value="">{t('selectPlaceholder')}</option>
                  {f.options.map((o) => <option key={o.value} value={o.value}>{isRtl ? o.ar : o.fr}</option>)}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea id={`f-${f.key}`} className="rk-textarea" rows={3} maxLength={f.max}
                  value={val} onChange={(e) => setValue(f.key, e.target.value)} />
              ) : (
                <input id={`f-${f.key}`} className="rk-input" type={f.type} maxLength={f.max}
                  dir={f.type === 'email' || f.type === 'tel' ? 'ltr' : undefined}
                  value={val} onChange={(e) => setValue(f.key, e.target.value)} />
              )}
            </div>
          )
        })}
      </div>

      {error && <p className="rk-note err" style={{ marginTop: 14 }}>{error}</p>}
      {saved && !error && <p className="rk-note" style={{ marginTop: 14, background: 'var(--ok-tint)', color: 'var(--ok)' }}>{t('infoSaved')}</p>}

      <button onClick={save} disabled={saving} className="rk-btn rk-btn-primary" style={{ marginTop: 16 }}>
        {saving ? t('saving') : t('saveInfo')}
      </button>
    </div>
  )
}
