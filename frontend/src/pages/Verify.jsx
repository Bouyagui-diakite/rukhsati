import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { setLanguage } from '../i18n'

const STATUS_STYLES = {
  valid: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', key: 'statusValid' },
  suspended: { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 ring-amber-600/20', key: 'statusSuspended' },
  expired: { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 ring-red-600/20', key: 'statusExpired' },
  revoked: { dot: 'bg-red-600', badge: 'bg-red-50 text-red-700 ring-red-600/20', key: 'statusRevoked' },
}

function Field({ label, children }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <dt className="text-xs uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-base font-semibold text-gray-900">{children}</dd>
    </div>
  )
}

export default function Verify() {
  const { token: tokenParam } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const [input, setInput] = useState(tokenParam ?? '')
  const [state, setState] = useState({ status: 'idle' }) // idle | loading | ok | notfound | error
  const isRtl = i18n.language === 'ar'

  const fmtDate = useCallback(
    (value) => new Date(value).toLocaleDateString(isRtl ? 'ar-MR' : 'fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }),
    [isRtl],
  )

  const fmtDateTime = useCallback(
    (value) => new Date(value).toLocaleString(isRtl ? 'ar-MR' : 'fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }),
    [isRtl],
  )

  useEffect(() => {
    if (!tokenParam) {
      setState({ status: 'idle' })
      return
    }

    let cancelled = false
    setState({ status: 'loading' })

    axios
      .get(`/api/verify/${encodeURIComponent(tokenParam)}`)
      .then((res) => {
        if (!cancelled) setState({ status: 'ok', data: res.data })
      })
      .catch((err) => {
        if (cancelled) return
        setState({ status: err.response?.status === 404 ? 'notfound' : 'error' })
      })

    return () => { cancelled = true }
  }, [tokenParam])

  const submit = (e) => {
    e.preventDefault()
    const value = input.trim()
    if (value) navigate(`/verifier/${encodeURIComponent(value)}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md flex items-center justify-between mb-6">
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">← {t('backHome')}</Link>
        <button
          className="text-sm border rounded-full px-4 py-1 text-gray-600 hover:bg-gray-100"
          onClick={() => setLanguage(isRtl ? 'fr' : 'ar')}
        >
          {isRtl ? 'Français' : 'العربية'}
        </button>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
        <div className="px-6 py-5 text-white" style={{ background: 'var(--rk-green)' }}>
          <h1 className="text-lg font-semibold">{t('verifyTitle')}</h1>
          <p className="text-sm text-white/80">{t('ministry')}</p>
        </div>

        <div className="p-6">
          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className="text-sm text-gray-600" htmlFor="token">{t('verifyTokenLabel')}</label>
            <input
              id="token"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('verifyTokenPlaceholder')}
              dir="ltr"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="rounded-lg py-2.5 text-white font-medium disabled:opacity-50"
              style={{ background: 'var(--rk-green)' }}
              disabled={!input.trim() || state.status === 'loading'}
            >
              {state.status === 'loading' ? t('verifyLoading') : t('verifyButton')}
            </button>
          </form>

          {state.status === 'idle' && !tokenParam && (
            <p className="mt-4 text-sm text-gray-500">{t('verifyIntro')}</p>
          )}

          {state.status === 'loading' && (
            <p className="mt-6 text-center text-gray-500">{t('verifyLoading')}</p>
          )}

          {state.status === 'notfound' && (
            <div className="mt-6 rounded-lg bg-red-50 ring-1 ring-red-600/20 p-4 text-center">
              <p className="font-semibold text-red-700">{t('verifyNotFound')}</p>
              <p className="mt-1 text-sm text-red-600/80">{t('verifyNotFoundHint')}</p>
            </div>
          )}

          {state.status === 'error' && (
            <p className="mt-6 rounded-lg bg-amber-50 ring-1 ring-amber-600/20 p-4 text-center text-amber-700">
              {t('verifyError')}
            </p>
          )}

          {state.status === 'ok' && state.data && (() => {
            const style = STATUS_STYLES[state.data.status] ?? STATUS_STYLES.revoked
            return (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${style.dot}`} />
                  <span className="text-sm font-medium text-gray-700">{t('verifyAuthentic')}</span>
                  <span className={`ms-auto inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${style.badge}`}>
                    {t(style.key)}
                  </span>
                </div>

                <dl>
                  <Field label={t('fieldNumber')}>
                    <span className="font-mono">{state.data.number}</span>
                  </Field>
                  <Field label={t('fieldOperator')}>{state.data.operator}</Field>
                  <Field label={t('fieldType')}>
                    {isRtl ? state.data.type_ar : state.data.type_fr}
                  </Field>
                  <Field label={t('fieldIssuedAt')}>{fmtDate(state.data.issued_at)}</Field>
                  <Field label={t('fieldExpiresAt')}>{fmtDate(state.data.expires_at)}</Field>
                </dl>

                <p className="mt-4 text-xs text-gray-400">
                  {t('verifiedAt')} {fmtDateTime(state.data.verified_at)}
                </p>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
