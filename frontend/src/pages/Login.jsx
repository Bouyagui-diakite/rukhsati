import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth, homePathFor } from '../auth'
import { setLanguage } from '../i18n'
import Emblem from '../components/Emblem'

export default function Login() {
  const { t, i18n } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isRtl = i18n.language === 'ar'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const user = await login(email.trim(), password)
      navigate(location.state?.from ?? homePathFor(user), { replace: true })
    } catch (err) {
      setError(err.response?.data?.errors?.email?.[0] ?? err.response?.data?.message ?? t('loginError'))
    } finally {
      setSubmitting(false)
    }
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
          <div>
            <h1>{t('loginTitle')}</h1>
            <p>{t('appName')} — {t('ministry')}</p>
          </div>
        </div>

        <form onSubmit={submit} className="rk-public-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <p className="rk-note err">{error}</p>}

          <div className="rk-field">
            <label className="rk-label" htmlFor="email">{t('emailLabel')}</label>
            <input className="rk-input" id="email" type="email" autoComplete="email" dir="ltr" required
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="rk-field">
            <label className="rk-label" htmlFor="password">{t('passwordLabel')}</label>
            <input className="rk-input" id="password" type="password" autoComplete="current-password" dir="ltr" required
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button type="submit" disabled={submitting || !email.trim() || !password} className="rk-btn rk-btn-primary rk-btn-block">
            {submitting ? t('loginLoading') : t('loginButton')}
          </button>
        </form>
      </div>
    </div>
  )
}
