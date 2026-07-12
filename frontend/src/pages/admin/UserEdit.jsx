import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api'
import { useAuth } from '../../auth'
import AppShell from '../../components/AppShell'

const ROLES = ['operator', 'officer', 'inspector', 'director', 'admin']
const BLANK = { name: '', email: '', phone: '', role: 'officer', password: '' }

export default function UserEdit() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { user: me } = useAuth()
  const navigate = useNavigate()
  const isNew = id === undefined
  const isSelf = !isNew && Number(id) === me?.id

  const [form, setForm] = useState(isNew ? BLANK : null)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/users')
      const u = res.data.find((x) => x.id === Number(id))
      if (!u) { setLoadError(true); return }
      setForm({ name: u.name, email: u.email, phone: u.phone ?? '', role: u.role, password: '' })
    } catch { setLoadError(true) }
  }, [id])

  useEffect(() => { if (!isNew) load() }, [isNew, load])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    setError('')
    setSaving(true)
    try {
      const payload = { name: form.name.trim(), email: form.email.trim(), phone: form.phone, role: form.role }
      if (form.password) payload.password = form.password
      if (isNew) await api.post('/admin/users', payload)
      else await api.put(`/admin/users/${id}`, payload)
      navigate('/admin/utilisateurs')
    } catch (err) {
      const errs = err.response?.data?.errors
      setError((errs && Object.values(errs)[0]?.[0]) ?? err.response?.data?.message ?? t('actionError'))
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!window.confirm(t('confirmDeleteUser'))) return
    setError('')
    try {
      await api.delete(`/admin/users/${id}`)
      navigate('/admin/utilisateurs')
    } catch (err) {
      setError(err.response?.data?.errors?.user?.[0] ?? err.response?.data?.message ?? t('actionError'))
    }
  }

  if (loadError) return <AppShell variant="admin" title={t('editUser')}><p className="rk-note err">{t('detailNotFound')}</p></AppShell>
  if (!form) return <AppShell variant="admin" title={t('editUser')}><p style={{ color: 'var(--ink-soft)' }}>{t('detailLoading')}</p></AppShell>

  return (
    <AppShell variant="admin" eyebrow={t('adminEyebrow')} title={isNew ? t('createUser') : t('editUser')}>
      <div style={{ maxWidth: 520 }}>
        <div className="rk-card">
          <div className="rk-card-b" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="rk-field">
              <label className="rk-label">{t('nameLabel')}</label>
              <input className="rk-input" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="rk-field">
              <label className="rk-label">{t('emailLabel')}</label>
              <input className="rk-input" type="email" dir="ltr" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="rk-field">
              <label className="rk-label">{t('phoneLabel')}</label>
              <input className="rk-input" type="tel" dir="ltr" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="rk-field">
              <label className="rk-label">{t('roleLabel')}</label>
              <select className="rk-select" value={form.role} onChange={(e) => set('role', e.target.value)} disabled={isSelf}>
                {ROLES.map((r) => <option key={r} value={r}>{t(`role_${r}`)}</option>)}
              </select>
            </div>
            <div className="rk-field">
              <label className="rk-label">{t('passwordLabel')}</label>
              <input className="rk-input" type="password" dir="ltr" autoComplete="new-password"
                value={form.password} onChange={(e) => set('password', e.target.value)} />
              <span style={{ fontSize: '.76rem', color: 'var(--ink-faint)' }}>{isNew ? t('passwordHint') : t('passwordKeep')}</span>
            </div>
          </div>
        </div>

        {error && <p className="rk-note err" style={{ margin: '14px 0' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 14 }}>
          <button className="rk-btn rk-btn-primary" onClick={save} disabled={saving}>
            {saving ? t('saving') : t('saveUser')}
          </button>
          {!isNew && !isSelf && <button className="rk-btn rk-btn-danger" onClick={remove}>{t('deleteUser')}</button>}
        </div>
      </div>
    </AppShell>
  )
}
