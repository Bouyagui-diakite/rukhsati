import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import api from '../../api'
import { useAuth } from '../../auth'
import AppShell from '../../components/AppShell'

const ROLE_STYLE = {
  operator: ['var(--ink-soft)', 'var(--surface-2)'],
  officer: ['var(--info)', 'var(--info-tint)'],
  inspector: ['var(--info)', 'var(--info-tint)'],
  director: ['var(--warn)', 'var(--warn-tint)'],
  admin: ['var(--gold)', 'var(--gold-tint)'],
}

export default function Users() {
  const { t } = useTranslation()
  const { user: me } = useAuth()
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    api.get('/admin/users')
      .then((res) => { if (!cancelled) setState({ status: 'ok', rows: res.data }) })
      .catch(() => { if (!cancelled) setState({ status: 'error' }) })
    return () => { cancelled = true }
  }, [])

  const rows = state.rows ?? []

  const newBtn = (
    <Link to="/admin/utilisateurs/nouveau" className="rk-btn rk-btn-primary" style={{ textDecoration: 'none' }}>
      + {t('newUser')}
    </Link>
  )

  return (
    <AppShell variant="admin" eyebrow={t('adminEyebrow')} title={t('adminUsersTitle')} actions={newBtn}>
      {state.status === 'loading' && <p style={{ color: 'var(--ink-soft)' }}>{t('detailLoading')}</p>}
      {state.status === 'error' && <p className="rk-note warn">{t('verifyError')}</p>}

      {state.status === 'ok' && (
        <div className="rk-card">
          {rows.map((u) => {
            const [color, background] = ROLE_STYLE[u.role] ?? ROLE_STYLE.operator
            return (
              <Link key={u.id} to={`/admin/utilisateurs/${u.id}`} className="rk-row">
                <div className="body">
                  <div className="line1">
                    <span className="who">{u.name}</span>
                    <span className="rk-chip" style={{ color, background }}>{t(`role_${u.role}`)}</span>
                    {u.id === me?.id && <span className="rk-flag due">{t('you')}</span>}
                  </div>
                  <div className="line2">
                    <span dir="ltr">{u.email}</span>
                    {u.phone && <><span className="sep">·</span><span dir="ltr">{u.phone}</span></>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}
