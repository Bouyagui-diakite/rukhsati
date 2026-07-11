import { useTranslation } from 'react-i18next'

// Chaque statut → couleurs sémantiques (encre + fond) via les tokens.
const STYLE = {
  draft: ['var(--ink-soft)', 'var(--surface-2)'],
  submitted: ['var(--info)', 'var(--info-tint)'],
  under_review: ['var(--info)', 'var(--info-tint)'],
  awaiting_documents: ['var(--warn)', 'var(--warn-tint)'],
  technical_review: ['var(--info)', 'var(--info-tint)'],
  inspection: ['var(--info)', 'var(--info-tint)'],
  awaiting_decision: ['var(--warn)', 'var(--warn-tint)'],
  approved: ['var(--ok)', 'var(--ok-tint)'],
  rejected: ['var(--danger)', 'var(--danger-tint)'],
}

/** Pastille de statut d'un dossier (clé i18n `st_<status>`). */
export default function StatusBadge({ status, dot = false }) {
  const { t } = useTranslation()
  const [color, background] = STYLE[status] ?? STYLE.draft
  return (
    <span className="rk-chip" style={{ color, background }}>
      {dot && <span className="dot" />}
      {t(`st_${status}`)}
    </span>
  )
}
