import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api'

/**
 * Cloche de notifications in-app : badge du nombre de non-lues, panneau
 * déroulant listant les changements de statut des dossiers de l'utilisateur.
 * Le compteur est rafraîchi périodiquement.
 */
export default function NotificationBell() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isRtl = i18n.language === 'ar'

  const [open, setOpen] = useState(false)
  const [data, setData] = useState({ unread: 0, items: [] })
  const wrapRef = useRef(null)

  const load = useCallback(() => {
    api.get('/notifications').then((res) => setData(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, 30000) // rafraîchissement léger
    return () => clearInterval(timer)
  }, [load])

  // Fermer au clic extérieur.
  useEffect(() => {
    if (!open) return
    const onClick = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const fmtWhen = (iso) => {
    const d = new Date(iso)
    const mins = Math.round((Date.now() - d.getTime()) / 60000)
    if (mins < 1) return t('notifNow')
    if (mins < 60) return `${mins} min`
    return d.toLocaleDateString(isRtl ? 'ar-MR' : 'fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const openItem = async (n) => {
    setOpen(false)
    if (!n.read) {
      try { await api.post(`/notifications/${n.id}/read`) } catch { /* silencieux */ }
      load()
    }
    if (n.data?.application_id) navigate(`/operateur/dossiers/${n.data.application_id}`)
  }

  const markAll = async () => {
    try { await api.post('/notifications/read-all') } catch { /* silencieux */ }
    load()
  }

  return (
    <div className="rk-notif-wrap" ref={wrapRef}>
      <button className="rk-bell" onClick={() => setOpen((o) => !o)} aria-label={t('notifications')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round" />
        </svg>
        {data.unread > 0 && <span className="cnt">{data.unread > 9 ? '9+' : data.unread}</span>}
      </button>

      {open && (
        <div className="rk-notif-panel">
          <div className="rk-notif-head">
            <b>{t('notifications')}</b>
            {data.unread > 0 && <button onClick={markAll}>{t('markAllRead')}</button>}
          </div>

          {data.items.length === 0 ? (
            <div className="rk-notif-empty">{t('noNotifications')}</div>
          ) : (
            <div className="rk-notif-list">
              {data.items.map((n) => (
                <button key={n.id} className={`rk-notif-item ${n.read ? '' : 'unread'}`} onClick={() => openItem(n)}>
                  <div className="nref">{n.data?.reference}</div>
                  <div className="nttl">{n.data?.status_label}</div>
                  {n.data?.comment && <div className="ncmt">{n.data.comment}</div>}
                  <div className="nwhen">{fmtWhen(n.created_at)}{n.data?.actor ? ` · ${n.data.actor}` : ''}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
