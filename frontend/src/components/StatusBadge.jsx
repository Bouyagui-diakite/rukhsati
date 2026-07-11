import { useTranslation } from 'react-i18next'

const STATUS_BADGE = {
  draft: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  submitted: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  under_review: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  awaiting_documents: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  technical_review: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  inspection: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  awaiting_decision: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  rejected: 'bg-red-50 text-red-700 ring-red-600/20',
}

/** Pastille de statut d'un dossier (clé i18n `st_<status>`). */
export default function StatusBadge({ status }) {
  const { t } = useTranslation()
  const cls = STATUS_BADGE[status] ?? STATUS_BADGE.draft
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {t(`st_${status}`)}
    </span>
  )
}
