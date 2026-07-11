import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api'
import { setLanguage } from '../../i18n'
import StatusBadge from '../../components/StatusBadge'

const CONCLUSIONS = ['favorable', 'reserved', 'unfavorable']

function Section({ title, children }) {
  return (
    <section className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
      <h2 className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700">{title}</h2>
      <div className="p-4">{children}</div>
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
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="text-white" style={{ background: 'var(--rk-green)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link to="/inspecteur" className="text-sm text-white/90 hover:text-white">← {t('inspectorTitle')}</Link>
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
              </div>
              <StatusBadge status={app.status} />
            </div>

            <Section title={t('sectionInspection')}>
              <p className="text-sm text-gray-600">
                {t('inspScheduledFor')} : <span className="text-gray-800">{fmtDate(insp?.scheduled_for)}</span>
              </p>

              {canReport ? (
                <div className="mt-4 flex flex-col gap-3">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-gray-600">{t('conclusionLabel')}</span>
                    <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={conclusion} onChange={(e) => setConclusion(e.target.value)}>
                      <option value="">{t('selectPlaceholder')}</option>
                      {CONCLUSIONS.map((c) => <option key={c} value={c}>{t(`conclusion_${c}`)}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-gray-600">{t('notesLabel')}</span>
                    <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </label>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <button onClick={submit} disabled={busy || !conclusion}
                    className="rounded-lg py-2.5 text-white font-medium disabled:opacity-50" style={{ background: 'var(--rk-green)' }}>
                    {busy ? t('submitting') : t('submitReport')}
                  </button>
                </div>
              ) : insp?.conclusion && (
                <div className="mt-3 text-sm">
                  <p><span className="text-gray-400">{t('inspConclusion')} :</span>{' '}
                    <span className="font-medium text-gray-800">{t(`conclusion_${insp.conclusion}`)}</span></p>
                  {insp.notes && <p className="mt-1 text-gray-600">{insp.notes}</p>}
                  <p className="mt-2 text-emerald-700">{t('reportSubmitted')}</p>
                </div>
              )}
            </Section>
          </>
        )}
      </main>
    </div>
  )
}
