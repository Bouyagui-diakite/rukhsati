import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api'
import AppShell from '../../components/AppShell'

const BLANK = {
  code: '', name_fr: '', name_ar: '', description_fr: '', description_ar: '',
  fee_mru: 0, validity_months: 12, requires_inspection: false, review_deadline_days: 10,
  active: true, documents: [],
}
const BLANK_DOC = { name_fr: '', name_ar: '', mandatory: true, accepted_formats: 'pdf,jpg,png', max_size_kb: 5120 }

function Section({ title, children, actions }) {
  return (
    <section className="rk-card" style={{ marginBottom: 18 }}>
      <div className="rk-card-h"><h2>{title}</h2>{actions}</div>
      <div className="rk-card-b">{children}</div>
    </section>
  )
}

function Switch({ label, checked, onChange }) {
  return (
    <label className="rk-switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="track" />
      <span>{label}</span>
    </label>
  )
}

export default function LicenseTypeEdit() {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isNew = id === undefined

  const [form, setForm] = useState(isNew ? BLANK : null)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/admin/license-types/${id}`)
      const d = res.data
      setForm({
        code: d.code, name_fr: d.name_fr, name_ar: d.name_ar,
        description_fr: d.description_fr ?? '', description_ar: d.description_ar ?? '',
        fee_mru: d.fee_mru, validity_months: d.validity_months,
        requires_inspection: d.requires_inspection, review_deadline_days: d.review_deadline_days,
        active: d.active,
        documents: (d.required_documents ?? []).map((x) => ({
          id: x.id, name_fr: x.name_fr, name_ar: x.name_ar, mandatory: x.mandatory,
          accepted_formats: x.accepted_formats, max_size_kb: x.max_size_kb,
        })),
      })
    } catch { setLoadError(true) }
  }, [id])

  useEffect(() => { if (!isNew) load() }, [isNew, load])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const setDoc = (i, k, v) => setForm((f) => ({ ...f, documents: f.documents.map((d, j) => j === i ? { ...d, [k]: v } : d) }))
  const addDoc = () => setForm((f) => ({ ...f, documents: [...f.documents, { ...BLANK_DOC }] }))
  const removeDoc = (i) => setForm((f) => ({ ...f, documents: f.documents.filter((_, j) => j !== i) }))

  const save = async () => {
    setError('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        fee_mru: Number(form.fee_mru), validity_months: Number(form.validity_months),
        review_deadline_days: Number(form.review_deadline_days),
        documents: form.documents.map((d) => ({ ...d, max_size_kb: Number(d.max_size_kb) })),
      }
      if (isNew) await api.post('/admin/license-types', payload)
      else await api.put(`/admin/license-types/${id}`, payload)
      navigate('/admin')
    } catch (err) {
      const errs = err.response?.data?.errors
      setError((errs && Object.values(errs)[0]?.[0]) ?? err.response?.data?.message ?? t('actionError'))
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!window.confirm(t('confirmDeleteType'))) return
    setError('')
    try {
      await api.delete(`/admin/license-types/${id}`)
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.errors?.type?.[0] ?? err.response?.data?.message ?? t('actionError'))
    }
  }

  if (loadError) return <AppShell variant="admin" title={t('editType')}><p className="rk-note err">{t('detailNotFound')}</p></AppShell>
  if (!form) return <AppShell variant="admin" title={t('editType')}><p style={{ color: 'var(--ink-soft)' }}>{t('detailLoading')}</p></AppShell>

  return (
    <AppShell variant="admin" eyebrow={t('adminEyebrow')} title={isNew ? t('createType') : t('editType')}>
      <div style={{ maxWidth: 720 }}>
        <Section title={t('adminTypesTitle')}>
          <div className="rk-form-grid">
            <div className="rk-field full">
              <label className="rk-label">{t('fieldCode')}</label>
              <input className="rk-input rk-mono" dir="ltr" value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="ex. travel_agency" />
            </div>
            <div className="rk-field">
              <label className="rk-label">{t('fieldNameFr')}</label>
              <input className="rk-input" value={form.name_fr} onChange={(e) => set('name_fr', e.target.value)} />
            </div>
            <div className="rk-field">
              <label className="rk-label">{t('fieldNameAr')}</label>
              <input className="rk-input" dir="rtl" value={form.name_ar} onChange={(e) => set('name_ar', e.target.value)} />
            </div>
            <div className="rk-field">
              <label className="rk-label">{t('fieldDescFr')}</label>
              <textarea className="rk-textarea" rows={2} value={form.description_fr} onChange={(e) => set('description_fr', e.target.value)} />
            </div>
            <div className="rk-field">
              <label className="rk-label">{t('fieldDescAr')}</label>
              <textarea className="rk-textarea" dir="rtl" rows={2} value={form.description_ar} onChange={(e) => set('description_ar', e.target.value)} />
            </div>
            <div className="rk-field">
              <label className="rk-label">{t('fieldFee')}</label>
              <input className="rk-input" type="number" min="0" value={form.fee_mru} onChange={(e) => set('fee_mru', e.target.value)} />
            </div>
            <div className="rk-field">
              <label className="rk-label">{t('fieldValidity')}</label>
              <input className="rk-input" type="number" min="1" value={form.validity_months} onChange={(e) => set('validity_months', e.target.value)} />
            </div>
            <div className="rk-field">
              <label className="rk-label">{t('fieldReviewDeadline')}</label>
              <input className="rk-input" type="number" min="1" value={form.review_deadline_days} onChange={(e) => set('review_deadline_days', e.target.value)} />
            </div>
            <div className="rk-field full" style={{ flexDirection: 'row', gap: 24, flexWrap: 'wrap', marginTop: 4 }}>
              <Switch label={t('fieldRequiresInspection')} checked={form.requires_inspection} onChange={(v) => set('requires_inspection', v)} />
              <Switch label={t('fieldActive')} checked={form.active} onChange={(v) => set('active', v)} />
            </div>
          </div>
        </Section>

        <Section title={t('requiredDocsTitle')} actions={<button className="rk-btn rk-btn-ghost rk-btn-sm" onClick={addDoc}>+ {t('addDocument')}</button>}>
          {form.documents.length === 0 && <p style={{ color: 'var(--ink-faint)', fontSize: '.88rem' }}>—</p>}
          {form.documents.map((doc, i) => (
            <div key={i} className="rk-doc-edit">
              <div className="grid">
                <div className="rk-field">
                  <label className="rk-label">{t('fieldNameFr')}</label>
                  <input className="rk-input" value={doc.name_fr} onChange={(e) => setDoc(i, 'name_fr', e.target.value)} />
                </div>
                <div className="rk-field">
                  <label className="rk-label">{t('fieldNameAr')}</label>
                  <input className="rk-input" dir="rtl" value={doc.name_ar} onChange={(e) => setDoc(i, 'name_ar', e.target.value)} />
                </div>
                <div className="rk-field">
                  <label className="rk-label">{t('docFormats')}</label>
                  <input className="rk-input rk-mono" dir="ltr" value={doc.accepted_formats} onChange={(e) => setDoc(i, 'accepted_formats', e.target.value)} placeholder="pdf,jpg,png" />
                </div>
                <div className="rk-field">
                  <label className="rk-label">{t('docMaxSize')}</label>
                  <input className="rk-input" type="number" min="1" value={doc.max_size_kb} onChange={(e) => setDoc(i, 'max_size_kb', e.target.value)} />
                </div>
              </div>
              <div className="foot">
                <Switch label={t('docMandatory')} checked={doc.mandatory} onChange={(v) => setDoc(i, 'mandatory', v)} />
                <button className="rm" onClick={() => removeDoc(i)}>{t('removeDoc')}</button>
              </div>
            </div>
          ))}
        </Section>

        {error && <p className="rk-note err" style={{ marginBottom: 14 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <button className="rk-btn rk-btn-primary" onClick={save} disabled={saving}>
            {saving ? t('saving') : t('saveType')}
          </button>
          {!isNew && <button className="rk-btn rk-btn-danger" onClick={remove}>{t('deleteType')}</button>}
        </div>
      </div>
    </AppShell>
  )
}
