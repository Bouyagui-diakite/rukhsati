import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api'
import AppShell from '../../components/AppShell'
import StatusBadge from '../../components/StatusBadge'

const CONCLUSIONS = ['favorable', 'reserved', 'unfavorable']

function Section({ title, children }) {
  return (
    <section className="rk-card" style={{ marginBottom: 18 }}>
      <div className="rk-card-h"><h2>{title}</h2></div>
      <div className="rk-card-b">{children}</div>
    </section>
  )
}

export default function InspectionReport() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'

  const [state, setState] = useState({ status: 'loading' })
  const [conclusion, setConclusion] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const fmtDate = useCallback(
    (v) => v && new Date(v).toLocaleDateString(isRtl ? 'ar-MR' : 'fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    [isRtl],
  )

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/applications/${id}`)
      setState({ status: 'ok', app: res.data })
    } catch (err) {
      setState({ status: [404, 403].includes(err.response?.status) ? 'notfound' : 'error' })
    }
  }, [id])

  useEffect(() => { setState({ status: 'loading' }); load() }, [load])

  const app = state.app
  const insp = app?.inspection
  const canReport = app?.status === 'inspection'

  const submit = async () => {
    setError('')
    setBusy(true)
    try {
      await api.post(`/applications/${id}/inspection/report`, { conclusion, notes: notes || null })
      await load()
    } catch (err) {
      setError(err.response?.data?.message ?? err.response?.data?.errors?.conclusion?.[0] ?? t('actionError'))
    } finally { setBusy(false) }
  }

  return (
    <AppShell
      variant="inspector"
      eyebrow={app?.reference}
      title={app ? (isRtl ? app.license_type?.name_ar : app.license_type?.name_fr) : t('detailLoading')}
      actions={app && <StatusBadge status={app.status} />}
    >
      {state.status === 'loading' && <p style={{ color: 'var(--ink-soft)' }}>{t('detailLoading')}</p>}
      {state.status === 'notfound' && <p className="rk-note err">{t('detailNotFound')}</p>}
      {state.status === 'error' && <p className="rk-note warn">{t('verifyError')}</p>}

      {state.status === 'ok' && app && (
        <div style={{ maxWidth: 620 }}>
          <Section title={t('sectionInspection')}>
            <dl className="rk-dl"><div className="kv"><dt>{t('inspScheduledFor')} :</dt><dd>{fmtDate(insp?.scheduled_for)}</dd></div></dl>

            {canReport ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
                <div className="rk-field">
                  <label className="rk-label">{t('conclusionLabel')}</label>
                  <select className="rk-select" value={conclusion} onChange={(e) => setConclusion(e.target.value)}>
                    <option value="">{t('selectPlaceholder')}</option>
                    {CONCLUSIONS.map((c) => <option key={c} value={c}>{t(`conclusion_${c}`)}</option>)}
                  </select>
                </div>
                <div className="rk-field">
                  <label className="rk-label">{t('notesLabel')}</label>
                  <textarea className="rk-textarea" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                {error && <p className="rk-note err">{error}</p>}
                <button onClick={submit} disabled={busy || !conclusion} className="rk-btn rk-btn-primary rk-btn-block">
                  {busy ? t('submitting') : t('submitReport')}
                </button>
              </div>
            ) : insp?.conclusion && (
              <div style={{ marginTop: 12 }}>
                <dl className="rk-dl"><div className="kv"><dt>{t('inspConclusion')} :</dt><dd>{t(`conclusion_${insp.conclusion}`)}</dd></div></dl>
                {insp.notes && <p style={{ color: 'var(--ink-soft)', marginTop: 8, fontSize: '.88rem' }}>{insp.notes}</p>}
                <p style={{ color: 'var(--ok)', marginTop: 10, fontSize: '.88rem', fontWeight: 600 }}>{t('reportSubmitted')}</p>
              </div>
            )}
          </Section>
        </div>
      )}
    </AppShell>
  )
}
