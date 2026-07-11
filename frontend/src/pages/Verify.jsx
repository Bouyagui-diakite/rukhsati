import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { setLanguage } from '../i18n'
import Emblem from '../components/Emblem'

const STATUS = {
  valid: ['var(--ok)', 'var(--ok-tint)', 'statusValid'],
  suspended: ['var(--warn)', 'var(--warn-tint)', 'statusSuspended'],
  expired: ['var(--danger)', 'var(--danger-tint)', 'statusExpired'],
  revoked: ['var(--danger)', 'var(--danger-tint)', 'statusRevoked'],
}

function Field({ label, children }) {
  return (
    <div className="rk-vrow"><dt>{label}</dt><dd>{children}</dd></div>
  )
}

export default function Verify() {
  const { token: tokenParam } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const [input, setInput] = useState(tokenParam ?? '')
  const [state, setState] = useState({ status: 'idle' })
  const isRtl = i18n.language === 'ar'

  const fmtDate = useCallback(
    (v) => new Date(v).toLocaleDateString(isRtl ? 'ar-MR' : 'fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    [isRtl],
  )
  const fmtDateTime = useCallback(
    (v) => new Date(v).toLocaleString(isRtl ? 'ar-MR' : 'fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    [isRtl],
  )

  useEffect(() => {
    if (!tokenParam) { setState({ status: 'idle' }); return }
    let cancelled = false
    setState({ status: 'loading' })
    axios.get(`/api/verify/${encodeURIComponent(tokenParam)}`)
      .then((res) => { if (!cancelled) setState({ status: 'ok', data: res.data }) })
      .catch((err) => { if (!cancelled) setState({ status: err.response?.status === 404 ? 'notfound' : 'error' }) })
    return () => { cancelled = true }
  }, [tokenParam])

  const submit = (e) => {
    e.preventDefault()
    const value = input.trim()
    if (value) navigate(`/verifier/${encodeURIComponent(value)}`)
  }

  return (
    <div className="rk-public">
      <div className="rk-public-top">
        <Link to="/" className="rk-back">← {t('backHome')}</Link>
        <span className="rk-lang">
          <button className={!isRtl ? 'on' : ''} onClick={() => setLanguage('fr')}>FR</button>
          <button className={isRtl ? 'on' : ''} onClick={() => setLanguage('ar')}>ع</button>
        </span>
      </div>

      <div className="rk-public-card">
        <div className="rk-public-head">
          <Emblem />
          <div><h1>{t('verifyTitle')}</h1><p>{t('ministry')}</p></div>
        </div>

        <div className="rk-public-body">
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label className="rk-label" htmlFor="token">{t('verifyTokenLabel')}</label>
            <input className="rk-input rk-mono" id="token" dir="ltr" placeholder={t('verifyTokenPlaceholder')}
              value={input} onChange={(e) => setInput(e.target.value)} style={{ fontSize: '.85rem' }} />
            <button type="submit" className="rk-btn rk-btn-primary rk-btn-block" disabled={!input.trim() || state.status === 'loading'}>
              {state.status === 'loading' ? t('verifyLoading') : t('verifyButton')}
            </button>
          </form>

          {state.status === 'idle' && !tokenParam && <p style={{ marginTop: 16, fontSize: '.88rem', color: 'var(--ink-soft)' }}>{t('verifyIntro')}</p>}
          {state.status === 'loading' && <p style={{ marginTop: 22, textAlign: 'center', color: 'var(--ink-soft)' }}>{t('verifyLoading')}</p>}

          {state.status === 'notfound' && (
            <div className="rk-note err" style={{ marginTop: 22, textAlign: 'center' }}>
              <p style={{ fontWeight: 700, margin: 0 }}>{t('verifyNotFound')}</p>
              <p style={{ margin: '4px 0 0', opacity: .85 }}>{t('verifyNotFoundHint')}</p>
            </div>
          )}
          {state.status === 'error' && <p className="rk-note warn" style={{ marginTop: 22, textAlign: 'center' }}>{t('verifyError')}</p>}

          {state.status === 'ok' && state.data && (() => {
            const [color, background, key] = STATUS[state.data.status] ?? STATUS.revoked
            return (
              <div style={{ marginTop: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                  <span style={{ fontSize: '.88rem', fontWeight: 600, color: 'var(--ink)' }}>{t('verifyAuthentic')}</span>
                  <span className="rk-chip" style={{ marginInlineStart: 'auto', color, background }}>{t(key)}</span>
                </div>
                <dl>
                  <Field label={t('fieldNumber')}><span className="rk-mono">{state.data.number}</span></Field>
                  <Field label={t('fieldOperator')}>{state.data.operator}</Field>
                  <Field label={t('fieldType')}>{isRtl ? state.data.type_ar : state.data.type_fr}</Field>
                  <Field label={t('fieldIssuedAt')}>{fmtDate(state.data.issued_at)}</Field>
                  <Field label={t('fieldExpiresAt')}>{fmtDate(state.data.expires_at)}</Field>
                </dl>
                <p style={{ marginTop: 16, fontSize: '.72rem', color: 'var(--ink-faint)' }}>{t('verifiedAt')} {fmtDateTime(state.data.verified_at)}</p>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
