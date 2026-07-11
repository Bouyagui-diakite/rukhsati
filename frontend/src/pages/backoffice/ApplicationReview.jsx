import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api'
import { useAuth } from '../../auth'
import { setLanguage } from '../../i18n'
import StatusBadge from '../../components/StatusBadge'

const DOC_BADGE = {
  pending: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  rejected: 'bg-red-50 text-red-700 ring-red-600/20',
}

function Section({ title, children }) {
  return (
    <section className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
      <h2 className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700">{title}</h2>
      <div className="p-4">{children}</div>
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
  const [rejectDoc, setRejectDoc] = useState(null) // { id, reason }
  const [panel, setPanel] = useState(null) // { action, required, comment }

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

  // Exécute une action API puis rafraîchit ; remonte l'erreur de validation.
  const run = async (fn) => {
    setError('')
    setBusy(true)
    try {
      await fn()
      setPanel(null)
      setRejectDoc(null)
      await load()
    } catch (err) {
      setError(
        err.response?.data?.errors?.documents?.[0]
        ?? err.response?.data?.errors?.comment?.[0]
        ?? err.response?.data?.message
        ?? t('actionError'),
      )
    } finally {
      setBusy(false)
    }
  }

  const reviewDoc = (docId, status, reason) =>
    run(() => api.patch(`/applications/${id}/documents/${docId}/review`,
      status === 'rejected' ? { status, rejection_reason: reason } : { status }))

  const workflow = (path, body) => run(() => api.post(`/applications/${id}/${path}`, body))

  const underReview = app?.status === 'under_review'
  const canReviewDocs = underReview && isOfficer

  const downloadPdf = () => run(async () => {
    const res = await api.get(`/applications/${id}/license/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url; a.download = `agrement-${app.license?.number ?? id}.pdf`
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="text-white" style={{ background: 'var(--rk-green)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link to="/ministere" className="text-sm text-white/90 hover:text-white">← {t('boQueue')}</Link>
          <button className="text-sm border border-white/40 rounded-full px-3 py-1 hover:bg-white/10"
            onClick={() => setLanguage(isRtl ? 'fr' : 'ar')}>
            {isRtl ? 'Français' : 'العربية'}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-5">
        {state.status === 'loading' && <p className="text-gray-500">{t('detailLoading')}</p>}
        {state.status === 'notfound' && (
          <p className="rounded-lg bg-red-50 ring-1 ring-red-600/20 p-4 text-red-700">{t('detailNotFound')}</p>
        )}
        {state.status === 'error' && (
          <p className="rounded-lg bg-amber-50 ring-1 ring-amber-600/20 p-4 text-amber-700">{t('verifyError')}</p>
        )}

        {state.status === 'ok' && app && (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-lg font-semibold text-gray-900">{app.reference}</p>
                <p className="text-gray-500">{isRtl ? app.license_type?.name_ar : app.license_type?.name_fr}</p>
                {app.user && <p className="text-sm text-gray-400 mt-0.5">{app.user.name}</p>}
              </div>
              <StatusBadge status={app.status} />
            </div>

            {/* Pièces à contrôler */}
            {app.documents?.length > 0 && (
              <Section title={t('sectionDocuments')}>
                <ul className="divide-y divide-gray-100">
                  {app.documents.map((doc) => (
                    <li key={doc.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-800">
                          {isRtl ? doc.required_document?.name_ar : doc.required_document?.name_fr}
                          {doc.required_document?.mandatory && <span className="ms-2 text-xs text-gray-400">({t('mandatory')})</span>}
                        </span>
                        <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${DOC_BADGE[doc.status] ?? DOC_BADGE.pending}`}>
                          {t(`doc_${doc.status}`)}
                        </span>
                      </div>
                      {doc.status === 'rejected' && doc.rejection_reason && (
                        <p className="mt-1 text-xs text-red-600">{t('rejectionReason')} : {doc.rejection_reason}</p>
                      )}
                      {canReviewDocs && (
                        rejectDoc?.id === doc.id ? (
                          <div className="mt-2 flex flex-col gap-2">
                            <textarea
                              className="w-full text-sm rounded-lg border border-gray-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              rows={2} placeholder={t('rejectionReason')}
                              value={rejectDoc.reason}
                              onChange={(e) => setRejectDoc({ ...rejectDoc, reason: e.target.value })}
                            />
                            <div className="flex gap-2 justify-end">
                              <button className="text-xs px-3 py-1 rounded-lg border" onClick={() => setRejectDoc(null)}>{t('cancel')}</button>
                              <button className="text-xs px-3 py-1 rounded-lg bg-red-600 text-white disabled:opacity-50"
                                disabled={busy || !rejectDoc.reason.trim()}
                                onClick={() => reviewDoc(doc.id, 'rejected', rejectDoc.reason.trim())}>
                                {t('confirm')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 flex gap-2 justify-end">
                            <button className="text-xs px-3 py-1 rounded-lg border border-emerald-600 text-emerald-700 disabled:opacity-50"
                              disabled={busy} onClick={() => reviewDoc(doc.id, 'approved')}>
                              {t('docApprove')}
                            </button>
                            <button className="text-xs px-3 py-1 rounded-lg border border-red-500 text-red-600 disabled:opacity-50"
                              disabled={busy} onClick={() => setRejectDoc({ id: doc.id, reason: '' })}>
                              {t('docReject')}
                            </button>
                          </div>
                        )
                      )}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Agrément délivré (dossier approuvé) */}
            {app.license && (
              <Section title={t('sectionLicense')}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm"><span className="text-gray-400">{t('fieldNumber')} :</span>{' '}
                    <span className="font-mono font-semibold">{app.license.number}</span></p>
                  <button onClick={downloadPdf} disabled={busy}
                    className="rounded-lg px-4 py-2 text-white text-sm font-medium disabled:opacity-50" style={{ background: 'var(--rk-green)' }}>
                    ⬇ {t('downloadPdf')}
                  </button>
                </div>
              </Section>
            )}

            {/* Barre d'actions contextuelle */}
            <ActionBar
              app={app} isOfficer={isOfficer} isDirector={isDirector} busy={busy}
              t={t} isRtl={isRtl} panel={panel} setPanel={setPanel} error={error}
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
                <ol className="relative border-s border-gray-200 ms-2">
                  {app.events.map((ev) => (
                    <li key={ev.id} className="ms-4 pb-4 last:pb-0">
                      <span className="absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full bg-gray-300" />
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={ev.to_status} />
                        <span className="text-xs text-gray-400">{fmtDateTime(ev.created_at)}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-700">
                        {ev.comment || <span className="text-gray-400">{t('noComment')}</span>}
                      </p>
                      {ev.user && <p className="text-xs text-gray-400">— {ev.user.name}</p>}
                    </li>
                  ))}
                </ol>
              </Section>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function ActionBar({ app, isOfficer, isDirector, busy, t, isRtl, panel, setPanel, error, onStart, onForward, onToDecision, onReturn, onApprove, onReject, onSchedule }) {
  const primaryBtn = 'rounded-lg px-4 py-2 text-white text-sm font-medium disabled:opacity-50'
  const green = { background: 'var(--rk-green)' }

  // Panneau de planification d'inspection.
  if (panel?.action === 'schedule') {
    return <SchedulePanel t={t} isRtl={isRtl} busy={busy} error={error} onCancel={() => setPanel(null)} onSchedule={onSchedule} />
  }

  // Panneau de commentaire (renvoi / décision).
  if (panel) {
    const submit = () => {
      const c = panel.comment.trim()
      if (panel.action === 'return') onReturn(c)
      else if (panel.action === 'reject') onReject(c)
      else if (panel.action === 'approve') onApprove(c)
    }
    return (
      <Section title={t(`action${panel.action[0].toUpperCase()}${panel.action.slice(1)}`)}>
        <textarea
          className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          rows={3} placeholder={panel.required ? t('commentLabel') : t('commentOptional')}
          value={panel.comment} onChange={(e) => setPanel({ ...panel, comment: e.target.value })}
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-3 flex gap-2 justify-end">
          <button className="text-sm px-3 py-1.5 rounded-lg border" onClick={() => setPanel(null)}>{t('cancel')}</button>
          <button className={primaryBtn} style={green} disabled={busy || (panel.required && !panel.comment.trim())} onClick={submit}>
            {t('confirm')}
          </button>
        </div>
      </Section>
    )
  }

  const actions = []
  if (app.status === 'submitted' && isOfficer)
    actions.push(<button key="start" className={primaryBtn} style={green} disabled={busy} onClick={onStart}>{t('actionStart')}</button>)

  if (app.status === 'under_review' && isOfficer) {
    actions.push(<button key="return" className="rounded-lg px-4 py-2 text-sm font-medium border border-amber-500 text-amber-700 disabled:opacity-50" disabled={busy} onClick={() => setPanel({ action: 'return', required: true, comment: '' })}>{t('actionReturn')}</button>)
    actions.push(<button key="forward" className={primaryBtn} style={green} disabled={busy} onClick={onForward}>{t('actionForward')}</button>)
  }

  if (app.status === 'technical_review' && isOfficer) {
    if (app.license_type?.requires_inspection)
      actions.push(<button key="schedule" className={primaryBtn} style={green} disabled={busy} onClick={() => setPanel({ action: 'schedule' })}>{t('actionSchedule')}</button>)
    else
      actions.push(<button key="todecision" className={primaryBtn} style={green} disabled={busy} onClick={onToDecision}>{t('actionToDecision')}</button>)
  }

  if (app.status === 'inspection')
    actions.push(<p key="insp2" className="text-sm text-gray-500">{t('inspectionInProgress')}</p>)
  if (app.status === 'awaiting_documents')
    actions.push(<p key="await" className="text-sm text-gray-500">{t('awaitingOperator')}</p>)

  if (app.status === 'awaiting_decision' && isDirector) {
    actions.push(<button key="approve" className={primaryBtn} style={green} disabled={busy} onClick={() => setPanel({ action: 'approve', required: false, comment: '' })}>{t('actionApprove')}</button>)
    actions.push(<button key="reject" className="rounded-lg px-4 py-2 text-sm font-medium border border-red-500 text-red-600 disabled:opacity-50" disabled={busy} onClick={() => setPanel({ action: 'reject', required: true, comment: '' })}>{t('actionReject')}</button>)
  }

  if (app.status === 'rejected')
    actions.push(<p key="closed" className="text-sm text-gray-500">{t('caseClosed')}</p>)

  if (actions.length === 0) return null

  return (
    <Section title={t('boTitle')}>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2 justify-end items-center">{actions}</div>
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
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">{t('inspectorLabel')}</span>
          <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={inspectorId} onChange={(e) => setInspectorId(e.target.value)}>
            <option value="">{t('selectPlaceholder')}</option>
            {inspectors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">{t('scheduledForLabel')}</span>
          <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button className="text-sm px-3 py-1.5 rounded-lg border" onClick={onCancel}>{t('cancel')}</button>
          <button className="rounded-lg px-4 py-2 text-white text-sm font-medium disabled:opacity-50" style={{ background: 'var(--rk-green)' }}
            disabled={busy || !inspectorId || !date} onClick={() => onSchedule(inspectorId, date)}>
            {t('confirm')}
          </button>
        </div>
      </div>
    </Section>
  )
}
