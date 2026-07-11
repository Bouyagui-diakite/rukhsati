import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api'
import { useAuth } from '../../auth'
import AppShell from '../../components/AppShell'
import StatusBadge from '../../components/StatusBadge'
import DocBadge from '../../components/DocBadge'
import ApplicationForm from '../../components/ApplicationForm'

function Section({ title, children }) {
  return (
    <section className="rk-card" style={{ marginBottom: 18 }}>
      <div className="rk-card-h"><h2>{title}</h2></div>
      <div className="rk-card-b">{children}</div>
    </section>
  )
}

export default function ApplicationReview() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const isRtl = i18n.language === 'ar'
  const isOfficer = ['officer', 'admin'].includes(user?.role)
  const isDirector = ['director', 'admin'].includes(user?.role)

  const [state, setState] = useState({ status: 'loading' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [rejectDoc, setRejectDoc] = useState(null)
  const [panel, setPanel] = useState(null)

  const fmtDateTime = useCallback(
    (v) => v && new Date(v).toLocaleString(isRtl ? 'ar-MR' : 'fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
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

  const run = async (fn) => {
    setError('')
    setBusy(true)
    try {
      await fn()
      setPanel(null); setRejectDoc(null)
      await load()
    } catch (err) {
      setError(err.response?.data?.errors?.documents?.[0] ?? err.response?.data?.errors?.comment?.[0] ?? err.response?.data?.message ?? t('actionError'))
    } finally { setBusy(false) }
  }

  const reviewDoc = (docId, status, reason) =>
    run(() => api.patch(`/applications/${id}/documents/${docId}/review`, status === 'rejected' ? { status, rejection_reason: reason } : { status }))
  const workflow = (path, body) => run(() => api.post(`/applications/${id}/${path}`, body))

  const canReviewDocs = app?.status === 'under_review' && isOfficer

  const downloadPdf = () => run(async () => {
    const res = await api.get(`/applications/${id}/license/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url; a.download = `agrement-${app.license?.number ?? id}.pdf`
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
  })

  return (
    <AppShell
      variant="backoffice"
      eyebrow={app?.reference}
      title={app ? (isRtl ? app.license_type?.name_ar : app.license_type?.name_fr) : t('detailLoading')}
      subtitle={app?.user?.name}
      actions={app && <StatusBadge status={app.status} />}
    >
      {state.status === 'loading' && <p style={{ color: 'var(--ink-soft)' }}>{t('detailLoading')}</p>}
      {state.status === 'notfound' && <p className="rk-note err">{t('detailNotFound')}</p>}
      {state.status === 'error' && <p className="rk-note warn">{t('verifyError')}</p>}

      {state.status === 'ok' && app && (
        <div style={{ maxWidth: 680 }}>
          {app.form_data && Object.keys(app.form_data).length > 0 && (
            <Section title={t('sectionInfo')}>
              <ApplicationForm applicationId={app.id} initial={app.form_data} editable={false} />
            </Section>
          )}

          {app.documents?.length > 0 && (
            <Section title={t('sectionDocuments')}>
              {app.documents.map((doc) => (
                <div key={doc.id} className="rk-doc">
                  <div className="dl">
                    <p className="dn">{isRtl ? doc.required_document?.name_ar : doc.required_document?.name_fr}{doc.required_document?.mandatory && <span className="dm" style={{ display: 'inline', marginInlineStart: 6 }}>({t('mandatory')})</span>}</p>
                    {doc.status === 'rejected' && doc.rejection_reason && (
                      <p style={{ fontSize: '.76rem', color: 'var(--danger)', marginTop: 4 }}>{t('rejectionReason')} : {doc.rejection_reason}</p>
                    )}
                    {canReviewDocs && rejectDoc?.id === doc.id && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                        <textarea className="rk-textarea" rows={2} placeholder={t('rejectionReason')} value={rejectDoc.reason}
                          onChange={(e) => setRejectDoc({ ...rejectDoc, reason: e.target.value })} />
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button className="rk-btn rk-btn-ghost rk-btn-sm" onClick={() => setRejectDoc(null)}>{t('cancel')}</button>
                          <button className="rk-btn rk-btn-sm" style={{ background: 'var(--danger)', color: '#fff' }}
                            disabled={busy || !rejectDoc.reason.trim()} onClick={() => reviewDoc(doc.id, 'rejected', rejectDoc.reason.trim())}>{t('confirm')}</button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="side">
                    <DocBadge status={doc.status} />
                    {canReviewDocs && rejectDoc?.id !== doc.id && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="rk-btn rk-btn-primary rk-btn-sm" disabled={busy} onClick={() => reviewDoc(doc.id, 'approved')}>{t('docApprove')}</button>
                        <button className="rk-btn rk-btn-danger rk-btn-sm" disabled={busy} onClick={() => setRejectDoc({ id: doc.id, reason: '' })}>{t('docReject')}</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </Section>
          )}

          {app.license && (
            <Section title={t('sectionLicense')}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <p style={{ fontSize: '.9rem' }}><span style={{ color: 'var(--ink-faint)' }}>{t('fieldNumber')} :</span> <b className="rk-mono">{app.license.number}</b></p>
                <button onClick={downloadPdf} disabled={busy} className="rk-btn rk-btn-primary">⬇ {t('downloadPdf')}</button>
              </div>
            </Section>
          )}

          <ActionBar
            app={app} isOfficer={isOfficer} isDirector={isDirector} busy={busy}
            t={t} panel={panel} setPanel={setPanel} error={error}
            onStart={() => workflow('review/start')}
            onForward={() => workflow('review/forward')}
            onToDecision={() => workflow('review/to-decision')}
            onReturn={(comment) => workflow('review/return', { comment })}
            onApprove={(comment) => workflow('decision/approve', comment ? { comment } : {})}
            onReject={(comment) => workflow('decision/reject', { comment })}
            onSchedule={(inspector_id, scheduled_for) => workflow('inspection/schedule', { inspector_id, scheduled_for })}
          />

          {app.events?.length > 0 && (
            <Section title={t('sectionTimeline')}>
              <ol className="rk-tl">
                {app.events.map((ev) => (
                  <li key={ev.id}>
                    <span className="mk" />
                    <div className="top"><StatusBadge status={ev.to_status} /><span className="when">{fmtDateTime(ev.created_at)}</span></div>
                    <p className="cmt">{ev.comment || <span style={{ color: 'var(--ink-faint)' }}>{t('noComment')}</span>}</p>
                    {ev.user && <p className="by">— {ev.user.name}</p>}
                  </li>
                ))}
              </ol>
            </Section>
          )}
        </div>
      )}
    </AppShell>
  )
}

function ActionBar({ app, isOfficer, isDirector, busy, t, panel, setPanel, error, onStart, onForward, onToDecision, onReturn, onApprove, onReject, onSchedule }) {
  if (panel?.action === 'schedule') {
    return <SchedulePanel t={t} busy={busy} error={error} onCancel={() => setPanel(null)} onSchedule={onSchedule} />
  }

  if (panel) {
    const submit = () => {
      const c = panel.comment.trim()
      if (panel.action === 'return') onReturn(c)
      else if (panel.action === 'reject') onReject(c)
      else if (panel.action === 'approve') onApprove(c)
    }
    return (
      <Section title={t(`action${panel.action[0].toUpperCase()}${panel.action.slice(1)}`)}>
        <textarea className="rk-textarea" rows={3} placeholder={panel.required ? t('commentLabel') : t('commentOptional')}
          value={panel.comment} onChange={(e) => setPanel({ ...panel, comment: e.target.value })} />
        {error && <p className="rk-note err" style={{ marginTop: 8 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          <button className="rk-btn rk-btn-ghost" onClick={() => setPanel(null)}>{t('cancel')}</button>
          <button className="rk-btn rk-btn-primary" disabled={busy || (panel.required && !panel.comment.trim())} onClick={submit}>{t('confirm')}</button>
        </div>
      </Section>
    )
  }

  const actions = []
  if (app.status === 'submitted' && isOfficer)
    actions.push(<button key="start" className="rk-btn rk-btn-primary" disabled={busy} onClick={onStart}>{t('actionStart')}</button>)
  if (app.status === 'under_review' && isOfficer) {
    actions.push(<button key="return" className="rk-btn rk-btn-warn" disabled={busy} onClick={() => setPanel({ action: 'return', required: true, comment: '' })}>{t('actionReturn')}</button>)
    actions.push(<button key="forward" className="rk-btn rk-btn-primary" disabled={busy} onClick={onForward}>{t('actionForward')}</button>)
  }
  if (app.status === 'technical_review' && isOfficer) {
    if (app.license_type?.requires_inspection)
      actions.push(<button key="schedule" className="rk-btn rk-btn-primary" disabled={busy} onClick={() => setPanel({ action: 'schedule' })}>{t('actionSchedule')}</button>)
    else
      actions.push(<button key="todecision" className="rk-btn rk-btn-primary" disabled={busy} onClick={onToDecision}>{t('actionToDecision')}</button>)
  }
  if (app.status === 'inspection') actions.push(<p key="i" style={{ color: 'var(--ink-soft)', fontSize: '.88rem' }}>{t('inspectionInProgress')}</p>)
  if (app.status === 'awaiting_documents') actions.push(<p key="a" style={{ color: 'var(--ink-soft)', fontSize: '.88rem' }}>{t('awaitingOperator')}</p>)
  if (app.status === 'awaiting_decision' && isDirector) {
    actions.push(<button key="approve" className="rk-btn rk-btn-primary" disabled={busy} onClick={() => setPanel({ action: 'approve', required: false, comment: '' })}>{t('actionApprove')}</button>)
    actions.push(<button key="reject" className="rk-btn rk-btn-danger" disabled={busy} onClick={() => setPanel({ action: 'reject', required: true, comment: '' })}>{t('actionReject')}</button>)
  }
  if (app.status === 'rejected') actions.push(<p key="c" style={{ color: 'var(--ink-soft)', fontSize: '.88rem' }}>{t('caseClosed')}</p>)

  if (actions.length === 0) return null

  return (
    <Section title={t('boTitle')}>
      {error && <p className="rk-note err" style={{ marginBottom: 12 }}>{error}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>{actions}</div>
    </Section>
  )
}

function SchedulePanel({ t, busy, error, onCancel, onSchedule }) {
  const [inspectors, setInspectors] = useState([])
  const [inspectorId, setInspectorId] = useState('')
  const [date, setDate] = useState('')
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    api.get('/backoffice/inspectors').then((res) => setInspectors(res.data)).catch(() => setInspectors([]))
  }, [])

  return (
    <Section title={t('actionSchedule')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="rk-field">
          <label className="rk-label">{t('inspectorLabel')}</label>
          <select className="rk-select" value={inspectorId} onChange={(e) => setInspectorId(e.target.value)}>
            <option value="">{t('selectPlaceholder')}</option>
            {inspectors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div className="rk-field">
          <label className="rk-label">{t('scheduledForLabel')}</label>
          <input className="rk-input" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        {error && <p className="rk-note err">{error}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="rk-btn rk-btn-ghost" onClick={onCancel}>{t('cancel')}</button>
          <button className="rk-btn rk-btn-primary" disabled={busy || !inspectorId || !date} onClick={() => onSchedule(inspectorId, date)}>{t('confirm')}</button>
        </div>
      </div>
    </Section>
  )
}
