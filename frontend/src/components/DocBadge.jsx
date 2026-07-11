import { useTranslation } from 'react-i18next'

const STYLE = {
  pending: ['var(--ink-soft)', 'var(--surface-2)'],
  approved: ['var(--ok)', 'var(--ok-tint)'],
  rejected: ['var(--danger)', 'var(--danger-tint)'],
}

/** Pastille de statut d'une pièce (clé i18n `doc_<status>`). */
export default function DocBadge({ status }) {
  const { t } = useTranslation()
  const [color, background] = STYLE[status] ?? STYLE.pending
  return <span className="rk-chip" style={{ color, background }}>{t(`doc_${status}`)}</span>
}
