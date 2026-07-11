import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth, homePathFor } from '../auth'
import { setLanguage } from '../i18n'
import Emblem from '../components/Emblem'

export default function Register() {
  const { t, i18n } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()
  const isRtl = i18n.language === 'ar'

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setError('') }

  const submit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password_confirmation) {
      setError(t('passwordMismatch'))
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const user = await register({ ...form, name: form.name.trim(), email: form.email.trim() })
      navigate(homePathFor(user), { replace: true })
    } catch (err) {
      const errors = err.response?.data?.errors
      const first = errors && Object.values(errors)[0]?.[0]
      setError(first ?? err.response?.data?.message ?? t('registerError'))
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
            <h1>{t('registerTitle')}</h1>
            <p>{t('registerSubtitle')}</p>
          </div>
        </div>

        <form onSubmit={submit} className="rk-public-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <p className="rk-note err">{error}</p>}

          <div className="rk-field">
            <label className="rk-label" htmlFor="name">{t('nameLabel')}</label>
            <input className="rk-input" id="name" autoComplete="organization" required
              value={form.name} onChange={set('name')} />
          </div>

          <div className="rk-field">
            <label className="rk-label" htmlFor="email">{t('emailLabel')}</label>
            <input className="rk-input" id="email" type="email" autoComplete="email" dir="ltr" required
              value={form.email} onChange={set('email')} />
          </div>

          <div className="rk-field">
            <label className="rk-label" htmlFor="phone">{t('phoneLabel')}</label>
            <input className="rk-input" id="phone" type="tel" autoComplete="tel" dir="ltr" required
              value={form.phone} onChange={set('phone')} />
          </div>

          <div className="rk-field">
            <label className="rk-label" htmlFor="password">{t('passwordLabel')}</label>
            <input className="rk-input" id="password" type="password" autoComplete="new-password" dir="ltr" required minLength={8}
              value={form.password} onChange={set('password')} />
            <span style={{ fontSize: '.76rem', color: 'var(--ink-faint)' }}>{t('passwordHint')}</span>
          </div>

          <div className="rk-field">
            <label className="rk-label" htmlFor="password_confirmation">{t('passwordConfirmLabel')}</label>
            <input className="rk-input" id="password_confirmation" type="password" autoComplete="new-password" dir="ltr" required
              value={form.password_confirmation} onChange={set('password_confirmation')} />
          </div>

          <button type="submit" disabled={submitting} className="rk-btn rk-btn-primary rk-btn-block">
            {submitting ? t('registering') : t('registerButton')}
          </button>

          <p style={{ textAlign: 'center', fontSize: '.84rem', color: 'var(--ink-soft)' }}>
            {t('haveAccount')} <Link to="/connexion" style={{ color: 'var(--green-600)', fontWeight: 600 }}>{t('login')}</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
