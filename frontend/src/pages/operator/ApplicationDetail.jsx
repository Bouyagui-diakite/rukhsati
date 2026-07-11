import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api'
import AppShell from '../../components/AppShell'
import StatusBadge from '../../components/StatusBadge'
import DocBadge from '../../components/DocBadge'
import ApplicationForm from '../../components/ApplicationForm'

const EDITABLE = ['draft', 'awaiting_documents']

function Section({ title, children }) {
  return (
    <section className="rk-card" style={{ marginBottom: 18 }}>
      <div className="rk-card-h"><h2>{title}</h2></div>
      <div className="rk-card-b">{children}</div>
    </section>
  )
}

export default function ApplicationDetail() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'

  const [state, setState] = useState({ status: 'loading' })
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const [uploadingId, setUploadingId] = useState(null)
  const [uploadError, setUploadError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const fmtDate = useCallback(
    (v) => v && new Date(v).toLocaleDateString(isRtl ? 'ar-MR' : 'fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    [isRtl],
  )
  const fmtDateTime = useCallback(
    (v) => v && new Date(v).toLocaleString(isRtl ? 'ar-MR' : 'fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    [isRtl],
  )
  const fmtSize = (kb) => (kb >= 1024 ? `${Math.round(kb / 1024)} Mo` : `${kb} Ko`)

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
  const license = app?.license
  const editable = app && EDITABLE.includes(app.status)
  const requiredDocs = app?.license_type?.required_documents ?? []
  const docByRequired = (rid) => app?.documents?.find((d) => d.required_document_id === rid)

  const downloadPdf = async () => {
    setDownloadError('')
    setDownloading(true)
    try {
      const res = await api.get(`/applications/${id}/license/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url; a.download = `agrement-${license?.number ?? id}.pdf`
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
    } catch {
      setDownloadError(t('downloadError'))
    } finally { setDownloading(false) }
  }

  const uploadDoc = async (requiredId, file) => {
    if (!file) return
    setUploadError('')
    setUploadingId(requiredId)
    try {
      const form = new FormData()
      form.append('required_document_id', requiredId)
      form.append('file', file)
      await api.post(`/applications/${id}/documents`, form)
      await load()
    } catch (err) {
      setUploadError(err.response?.data?.errors?.file?.[0] ?? err.response?.data?.message ?? t('uploadError'))
    } finally { setUploadingId(null) }
  }

  const submit = async () => {
    setSubmitError('')
    setSubmitting(true)
    try {
      await api.post(`/applications/${id}/${app.status === 'draft' ? 'submit' : 'resubmit'}`)
      await load()
    } catch (err) {
      setSubmitError(err.response?.data?.errors?.documents?.[0] ?? err.response?.data?.message ?? t('actionError'))
    } finally { setSubmitting(false) }
  }

  return (
    <AppShell
      variant="operator"
      eyebrow={app?.reference}
      title={app ? (isRtl ? app.license_type?.name_ar : app.license_type?.name_fr) : t('detailLoading')}
      actions={app && <StatusBadge status={app.status} />}
    >
      {state.status === 'loading' && <p style={{ color: 'var(--ink-soft)' }}>{t('detailLoading')}</p>}
      {state.status === 'notfound' && <p className="rk-note err">{t('detailNotFound')}</p>}
      {state.status === 'error' && <p className="rk-note warn">{t('verifyError')}</p>}

      {state.status === 'ok' && app && (
        <div style={{ maxWidth: 680 }}>
          <Section title={t('sectionInfo')}>
            <ApplicationForm
              applicationId={app.id}
              initial={app.form_data ?? {}}
              editable={editable}
              onSaved={() => load()}
            />
          </Section>

          {license && (
            <Section title={t('sectionLicense')}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <dl className="rk-dl">
                  <div className="kv"><dt>{t('fieldNumber')} :</dt><dd className="mono">{license.number}</dd></div>
                  <div className="kv"><dt>{t('fieldExpiresAt')} :</dt><dd>{fmtDate(license.expires_at)}</dd></div>
                </dl>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={downloadPdf} disabled={downloading} className="rk-btn rk-btn-primary">
                    {downloading ? t('downloadingPdf') : `⬇ ${t('downloadPdf')}`}
                  </button>
                  <Link to={`/verifier/${license.verification_token}`} style={{ textAlign: 'center', fontSize: '.82rem', color: 'var(--ink-soft)' }}>
                    {t('viewVerification')}
                  </Link>
                </div>
              </div>
              {downloadError && <p className="rk-note err" style={{ marginTop: 12 }}>{downloadError}</p>}
            </Section>
          )}

          {editable ? (
            <Section title={t('sectionDocuments')}>
              {requiredDocs.map((rd) => {
                const doc = docByRequired(rd.id)
                const busy = uploadingId === rd.id
                return (
                  <div key={rd.id} className="rk-doc">
                    <div className="dl">
                      <p className="dn">{isRtl ? rd.name_ar : rd.name_fr}{rd.mandatory && <span className="dm" style={{ display: 'inline', marginInlineStart: 6 }}>({t('mandatory')})</span>}</p>
                      <p className="dm">{t('acceptedFormats')} : {rd.accepted_formats} · {t('maxSize')} : {fmtSize(rd.max_size_kb)}</p>
                      {doc ? <p className="df">{doc.original_name}</p> : <p className="dm">{t('notUploaded')}</p>}
                      {doc?.status === 'rejected' && doc.rejection_reason && (
                        <p style={{ fontSize: '.76rem', color: 'var(--danger)', marginTop: 4 }}>{t('rejectionReason')} : {doc.rejection_reason}</p>
                      )}
                    </div>
                    <div className="side">
                      {doc && <DocBadge status={doc.status} />}
                      <label className={`rk-upload ${busy ? 'busy' : ''}`}>
                        {busy ? t('uploading') : (doc ? t('replaceFile') : t('chooseFile'))}
                        <input type="file" style={{ display: 'none' }}
                          accept={rd.accepted_formats?.split(',').map((f) => `.${f.trim()}`).join(',')}
                          disabled={busy}
                          onChange={(e) => { uploadDoc(rd.id, e.target.files[0]); e.target.value = '' }} />
                      </label>
                    </div>
                  </div>
                )
              })}

              {uploadError && <p className="rk-note err" style={{ marginTop: 12 }}>{uploadError}</p>}

              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                {submitError && <p className="rk-note err" style={{ marginBottom: 12 }}>{submitError}</p>}
                <button onClick={submit} disabled={submitting} className="rk-btn rk-btn-primary rk-btn-block">
                  {submitting ? t('submitting') : t('submitApplication')}
                </button>
              </div>
            </Section>
          ) : app.documents?.length > 0 && (
            <Section title={t('sectionDocuments')}>
              {app.documents.map((doc) => (
                <div key={doc.id} className="rk-doc">
                  <div className="dl">
                    <p className="dn">{isRtl ? doc.required_document?.name_ar : doc.required_document?.name_fr}{doc.required_document?.mandatory && <span className="dm" style={{ display: 'inline', marginInlineStart: 6 }}>({t('mandatory')})</span>}</p>
                    {doc.status === 'rejected' && doc.rejection_reason && (
                      <p style={{ fontSize: '.76rem', color: 'var(--danger)', marginTop: 4 }}>{t('rejectionReason')} : {doc.rejection_reason}</p>
                    )}
                  </div>
                  <div className="side"><DocBadge status={doc.status} /></div>
                </div>
              ))}
            </Section>
          )}

          {app.inspection && (
            <Section title={t('sectionInspection')}>
              <dl className="rk-dl">
                <div className="kv"><dt>{t('inspScheduledFor')} :</dt><dd>{fmtDate(app.inspection.scheduled_for)}</dd></div>
                {app.inspection.conclusion && <div className="kv"><dt>{t('inspConclusion')} :</dt><dd>{t(`conclusion_${app.inspection.conclusion}`)}</dd></div>}
              </dl>
              {app.inspection.notes && <p style={{ color: 'var(--ink-soft)', marginTop: 8, fontSize: '.88rem' }}>{app.inspection.notes}</p>}
            </Section>
          )}

          {app.events?.length > 0 && (
            <Section title={t('sectionTimeline')}>
              <ol className="rk-tl">
                {app.events.map((ev) => (
                  <li key={ev.id}>
                    <span className="mk" />
                    <div className="top"><StatusBadge status={ev.to_status} /><span className="when">{fmtDateTime(ev.created_at)}</span></div>
                    <p className="cmt">{ev.comment || <span className="rk-muted" style={{ color: 'var(--ink-faint)' }}>{t('noComment')}</span>}</p>
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
