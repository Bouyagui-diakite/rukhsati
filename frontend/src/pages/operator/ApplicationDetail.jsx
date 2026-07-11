import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api'
import { setLanguage } from '../../i18n'
import StatusBadge from '../../components/StatusBadge'

const DOC_BADGE = {
  pending: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  rejected: 'bg-red-50 text-red-700 ring-red-600/20',
}

const EDITABLE = ['draft', 'awaiting_documents']

function Section({ title, children }) {
  return (
    <section className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
      <h2 className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700">{title}</h2>
      <div className="p-4">{children}</div>
    </section>
  )
}

function DocBadge({ status }) {
  const { t } = useTranslation()
  return (
    <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${DOC_BADGE[status] ?? DOC_BADGE.pending}`}>
      {t(`doc_${status}`)}
    </span>
  )
}

export default function ApplicationDetail() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'

  const [state, setState] = useState({ status: 'loading' }) // loading | ok | notfound | error
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const [uploadingId, setUploadingId] = useState(null)
  const [uploadError, setUploadError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const fmtDate = useCallback(
    (value) => value && new Date(value).toLocaleDateString(isRtl ? 'ar-MR' : 'fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }),
    [isRtl],
  )
  const fmtDateTime = useCallback(
    (value) => value && new Date(value).toLocaleString(isRtl ? 'ar-MR' : 'fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }),
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
      // L'endpoint exige le jeton Bearer : on récupère le binaire via axios
      // (l'intercepteur ajoute l'en-tête) puis on déclenche le téléchargement.
      const res = await api.get(`/applications/${id}/license/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `agrement-${license?.number ?? id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setDownloadError(t('downloadError'))
    } finally {
      setDownloading(false)
    }
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
    } finally {
      setUploadingId(null)
    }
  }

  const submit = async () => {
    setSubmitError('')
    setSubmitting(true)
    try {
      const endpoint = app.status === 'draft' ? 'submit' : 'resubmit'
      await api.post(`/applications/${id}/${endpoint}`)
      await load()
    } catch (err) {
      setSubmitError(
        err.response?.data?.errors?.documents?.[0]
        ?? err.response?.data?.message
        ?? t('downloadError'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="text-white" style={{ background: 'var(--rk-green)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link to="/operateur" className="text-sm text-white/90 hover:text-white">← {t('detailBack')}</Link>
          <button
            className="text-sm border border-white/40 rounded-full px-3 py-1 hover:bg-white/10"
            onClick={() => setLanguage(isRtl ? 'fr' : 'ar')}
          >
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
                <p className="text-gray-500">
                  {isRtl ? app.license_type?.name_ar : app.license_type?.name_fr}
                </p>
              </div>
              <StatusBadge status={app.status} />
            </div>

            {license && (
              <Section title={t('sectionLicense')}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <dl className="text-sm">
                    <div className="flex gap-2">
                      <dt className="text-gray-400">{t('fieldNumber')} :</dt>
                      <dd className="font-mono font-semibold text-gray-900">{license.number}</dd>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <dt className="text-gray-400">{t('fieldExpiresAt')} :</dt>
                      <dd className="font-medium text-gray-700">{fmtDate(license.expires_at)}</dd>
                    </div>
                  </dl>
                  <div className="flex flex-col items-stretch gap-2">
                    <button
                      onClick={downloadPdf}
                      disabled={downloading}
                      className="rounded-lg px-4 py-2 text-white text-sm font-medium disabled:opacity-50"
                      style={{ background: 'var(--rk-green)' }}
                    >
                      {downloading ? t('downloadingPdf') : `⬇ ${t('downloadPdf')}`}
                    </button>
                    <Link
                      to={`/verifier/${license.verification_token}`}
                      className="text-center text-sm text-gray-600 underline hover:text-gray-800"
                    >
                      {t('viewVerification')}
                    </Link>
                  </div>
                </div>
                {downloadError && <p className="mt-3 text-sm text-red-600">{downloadError}</p>}
              </Section>
            )}

            {/* Pièces : mode dépôt si le dossier est éditable, sinon lecture seule. */}
            {editable ? (
              <Section title={t('sectionDocuments')}>
                <ul className="divide-y divide-gray-100">
                  {requiredDocs.map((rd) => {
                    const doc = docByRequired(rd.id)
                    const busy = uploadingId === rd.id
                    return (
                      <li key={rd.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm text-gray-800">
                              {isRtl ? rd.name_ar : rd.name_fr}
                              {rd.mandatory && <span className="ms-2 text-xs text-gray-400">({t('mandatory')})</span>}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {t('acceptedFormats')} : {rd.accepted_formats} · {t('maxSize')} : {fmtSize(rd.max_size_kb)}
                            </p>
                            {doc
                              ? <p className="text-xs text-gray-500 mt-1 truncate">{doc.original_name}</p>
                              : <p className="text-xs text-gray-400 mt-1">{t('notUploaded')}</p>}
                            {doc?.status === 'rejected' && doc.rejection_reason && (
                              <p className="mt-1 text-xs text-red-600">{t('rejectionReason')} : {doc.rejection_reason}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            {doc && <DocBadge status={doc.status} />}
                            <label className={`cursor-pointer text-xs rounded-lg border px-3 py-1.5 ${busy ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50'}`}>
                              {busy ? t('uploading') : (doc ? t('replaceFile') : t('chooseFile'))}
                              <input
                                type="file"
                                className="hidden"
                                accept={rd.accepted_formats?.split(',').map((f) => `.${f.trim()}`).join(',')}
                                disabled={busy}
                                onChange={(e) => { uploadDoc(rd.id, e.target.files[0]); e.target.value = '' }}
                              />
                            </label>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>

                {uploadError && <p className="mt-3 text-sm text-red-600">{uploadError}</p>}

                <div className="mt-4 pt-4 border-t border-gray-100">
                  {submitError && <p className="mb-3 text-sm text-red-600">{submitError}</p>}
                  <button
                    onClick={submit}
                    disabled={submitting}
                    className="w-full rounded-lg py-2.5 text-white font-medium disabled:opacity-50"
                    style={{ background: 'var(--rk-green)' }}
                  >
                    {submitting ? t('submitting') : t('submitApplication')}
                  </button>
                </div>
              </Section>
            ) : app.documents?.length > 0 && (
              <Section title={t('sectionDocuments')}>
                <ul className="divide-y divide-gray-100">
                  {app.documents.map((doc) => (
                    <li key={doc.id} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-800">
                          {isRtl ? doc.required_document?.name_ar : doc.required_document?.name_fr}
                          {doc.required_document?.mandatory && (
                            <span className="ms-2 text-xs text-gray-400">({t('mandatory')})</span>
                          )}
                        </span>
                        <DocBadge status={doc.status} />
                      </div>
                      {doc.status === 'rejected' && doc.rejection_reason && (
                        <p className="mt-1 text-xs text-red-600">{t('rejectionReason')} : {doc.rejection_reason}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {app.inspection && (
              <Section title={t('sectionInspection')}>
                <dl className="text-sm flex flex-col gap-1">
                  <div className="flex gap-2">
                    <dt className="text-gray-400">{t('inspScheduledFor')} :</dt>
                    <dd className="text-gray-700">{fmtDate(app.inspection.scheduled_for)}</dd>
                  </div>
                  {app.inspection.conclusion && (
                    <div className="flex gap-2">
                      <dt className="text-gray-400">{t('inspConclusion')} :</dt>
                      <dd className="text-gray-700">{t(`conclusion_${app.inspection.conclusion}`)}</dd>
                    </div>
                  )}
                  {app.inspection.notes && <p className="text-gray-600 mt-1">{app.inspection.notes}</p>}
                </dl>
              </Section>
            )}

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
