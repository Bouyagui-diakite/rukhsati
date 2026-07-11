import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth, homePathFor } from '../auth'
import { setLanguage } from '../i18n'

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
      const message = err.response?.data?.errors?.email?.[0]
        ?? err.response?.data?.message
        ?? t('loginError')
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-sm flex items-center justify-between mb-6">
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">← {t('backHome')}</Link>
        <button
          className="text-sm border rounded-full px-4 py-1 text-gray-600 hover:bg-gray-100"
          onClick={() => setLanguage(isRtl ? 'fr' : 'ar')}
        >
          {isRtl ? 'Français' : 'العربية'}
        </button>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
        <div className="px-6 py-5 text-white" style={{ background: 'var(--rk-green)' }}>
          <h1 className="text-lg font-semibold">{t('loginTitle')}</h1>
          <p className="text-sm text-white/80">{t('appName')} — {t('ministry')}</p>
        </div>

        <form onSubmit={submit} className="p-6 flex flex-col gap-4">
          {error && (
            <p className="rounded-lg bg-red-50 ring-1 ring-red-600/20 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600" htmlFor="email">{t('emailLabel')}</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600" htmlFor="password">{t('passwordLabel')}</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !email.trim() || !password}
            className="rounded-lg py-2.5 text-white font-medium disabled:opacity-50"
            style={{ background: 'var(--rk-green)' }}
          >
            {submitting ? t('loginLoading') : t('loginButton')}
          </button>
        </form>
      </div>
    </div>
  )
}
